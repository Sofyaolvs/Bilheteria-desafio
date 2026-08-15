import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reservation } from './reservation.entity';
import { EventEntity } from '../events/event.entity';
import { Seat } from '../events/seat.entity';
import { Payment } from '../payments/payment.entity';
import { PaymentStatus, ReservationStatus, SeatStatus, TicketingMode } from '../common/enums';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PayReservationDto } from './dto/pay-reservation.dto';
import { TicketsService } from '../tickets/tickets.service';

const HOLD_MINUTES = 10;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation) private readonly reservationsRepo: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private readonly ticketsService: TicketsService,
  ) {}

  async create(clientId: string, eventId: string, dto: CreateReservationDto) {
    // Isolamento padrão (READ COMMITTED) é suficiente aqui: a exclusão
    // mútua vem do lock pessimista explícito (SELECT ... FOR UPDATE) nos
    // assentos/evento, não do nível de isolamento da transação. Usar
    // SERIALIZABLE por cima do lock explícito só troca o "assento
    // indisponível" (claro) por uma falha de serialização do Postgres
    // (confuso) quando duas reservas colidem — por isso não uso aqui.
    return this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(EventEntity, { where: { id: eventId } });
      if (!event) throw new NotFoundException('Evento não encontrado.');
      if (!event.published) throw new BadRequestException('Evento não está publicado.');

      const holdsExpireAt = new Date(Date.now() + HOLD_MINUTES * 60_000);
      let totalPrice = 0;
      let quantity: number | null = null;

      const reservation = manager.create(Reservation, {
        eventId,
        clientId,
        status: ReservationStatus.PENDING_PAYMENT,
        holdsExpireAt,
        totalPrice: '0',
      });
      const saved = await manager.save(reservation);

      if (event.ticketingMode === TicketingMode.SEATED) {
        if (!dto.seatIds?.length) {
          throw new BadRequestException('Selecione ao menos um assento (seatIds).');
        }
        // Lock pessimista nas linhas dos assentos escolhidos: garante que,
        // sob concorrência, duas reservas não consigam "segurar" o mesmo
        // assento ao mesmo tempo (evita overselling).
        const seats = await manager
          .createQueryBuilder(Seat, 'seat')
          .setLock('pessimistic_write')
          .where('seat.id IN (:...ids)', { ids: dto.seatIds })
          .andWhere('seat.eventId = :eventId', { eventId })
          .getMany();

        if (seats.length !== dto.seatIds.length) {
          throw new NotFoundException('Um ou mais assentos não existem para este evento.');
        }

        const now = new Date();
        const unavailable = seats.filter((seat) => {
          const isHeldButExpired =
            seat.status === SeatStatus.HELD && seat.heldUntil && seat.heldUntil < now;
          return seat.status !== SeatStatus.AVAILABLE && !isHeldButExpired;
        });
        if (unavailable.length) {
          throw new ConflictException(
            `Assento(s) ${unavailable.map((s) => s.row + s.number).join(', ')} não estão mais disponíveis.`,
          );
        }

        for (const seat of seats) {
          seat.status = SeatStatus.HELD;
          seat.reservationId = saved.id;
          seat.heldUntil = holdsExpireAt;
        }
        await manager.save(seats);
        totalPrice = Number(event.price) * seats.length;
      } else {
        if (!dto.quantity || dto.quantity < 1) {
          throw new BadRequestException('Informe a quantidade de ingressos (quantity).');
        }
        // Lock pessimista na linha do evento: evita que duas reservas
        // concorrentes decrementem o estoque de pista para um número
        // negativo (race condition clássica de overselling).
        const lockedEvent = await manager
          .createQueryBuilder(EventEntity, 'event')
          .setLock('pessimistic_write')
          .where('event.id = :id', { id: eventId })
          .getOne();

        if ((lockedEvent.generalAvailable ?? 0) < dto.quantity) {
          throw new ConflictException('Não há ingressos suficientes disponíveis.');
        }
        lockedEvent.generalAvailable -= dto.quantity;
        await manager.save(lockedEvent);
        quantity = dto.quantity;
        totalPrice = Number(event.price) * dto.quantity;
      }

      saved.quantity = quantity;
      saved.totalPrice = totalPrice.toFixed(2);
      return manager.save(saved);
    });
  }

  async pay(reservationId: string, clientId: string, dto: PayReservationDto) {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
      relations: { event: true },
    });
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    if (reservation.clientId !== clientId) {
      throw new ForbiddenException('Esta reserva não pertence a você.');
    }
    if (reservation.status !== ReservationStatus.PENDING_PAYMENT) {
      throw new ConflictException(`Reserva já está com status ${reservation.status}.`);
    }
    if (reservation.holdsExpireAt < new Date()) {
      await this.expireReservation(reservation.id);
      throw new GoneException('O tempo para pagamento desta reserva expirou. Faça uma nova reserva.');
    }

    const digits = dto.cardNumber.replace(/\s/g, '');
    const approved = !digits.endsWith('0000');

    const payment = this.dataSource.getRepository(Payment).create({
      reservationId: reservation.id,
      cardHolder: dto.cardHolder,
      cardLast4: digits.slice(-4),
      status: approved ? PaymentStatus.APPROVED : PaymentStatus.DECLINED,
      reason: approved ? null : 'Cartão de teste recusado pela operadora simulada.',
    });
    await this.dataSource.getRepository(Payment).save(payment);

    if (!approved) {
      return { reservation, payment, tickets: [] };
    }

    return this.dataSource.transaction(async (manager) => {
      reservation.status = ReservationStatus.PAID;
      await manager.save(reservation);

      const tickets = [];
      if (reservation.event.ticketingMode === TicketingMode.SEATED) {
        const seats = await manager.find(Seat, { where: { reservationId: reservation.id } });
        for (const seat of seats) {
          seat.status = SeatStatus.SOLD;
          seat.heldUntil = null;
          await manager.save(seat);
          const ticket = await this.ticketsService.issueTicket(
            reservation,
            reservation.event,
            clientId,
            seat,
          );
          tickets.push(ticket);
        }
      } else {
        for (let i = 0; i < (reservation.quantity ?? 0); i++) {
          const ticket = await this.ticketsService.issueTicket(
            reservation,
            reservation.event,
            clientId,
            null,
          );
          tickets.push(ticket);
        }
      }
      return { reservation, payment, tickets };
    });
  }

  async findMine(clientId: string) {
    return this.reservationsRepo.find({
      where: { clientId },
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForClient(id: string, clientId: string) {
    const reservation = await this.reservationsRepo.findOne({
      where: { id },
      relations: { event: true },
    });
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    if (reservation.clientId !== clientId) throw new ForbiddenException();
    return reservation;
  }

  async cancel(id: string, clientId: string) {
    const reservation = await this.findOneForClient(id, clientId);
    if (reservation.status !== ReservationStatus.PENDING_PAYMENT) {
      throw new ConflictException('Só é possível cancelar reservas pendentes de pagamento.');
    }
    await this.releaseHold(reservation, ReservationStatus.CANCELLED);
    return reservation;
  }

  // Usado pelo cron de expiração e por cancelamentos manuais: devolve os
  // assentos/estoque de pista para disponível.
  async releaseHold(reservation: Reservation, finalStatus: ReservationStatus) {
    return this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(EventEntity, { where: { id: reservation.eventId } });
      if (event.ticketingMode === TicketingMode.SEATED) {
        const seats = await manager.find(Seat, { where: { reservationId: reservation.id } });
        for (const seat of seats) {
          if (seat.status === SeatStatus.SOLD) continue; // já pago, não libera
          seat.status = SeatStatus.AVAILABLE;
          seat.reservationId = null;
          seat.heldUntil = null;
          await manager.save(seat);
        }
      } else if (reservation.status === ReservationStatus.PENDING_PAYMENT) {
        event.generalAvailable = (event.generalAvailable ?? 0) + (reservation.quantity ?? 0);
        await manager.save(event);
      }
      reservation.status = finalStatus;
      await manager.save(reservation);
    });
  }

  async expireReservation(id: string) {
    const reservation = await this.reservationsRepo.findOne({ where: { id } });
    if (!reservation || reservation.status !== ReservationStatus.PENDING_PAYMENT) return;
    await this.releaseHold(reservation, ReservationStatus.EXPIRED);
  }

  async expireAllOverdue() {
    const overdue = await this.reservationsRepo.find({
      where: { status: ReservationStatus.PENDING_PAYMENT },
    });
    const now = new Date();
    const toExpire = overdue.filter((r) => r.holdsExpireAt < now);
    for (const reservation of toExpire) {
      await this.releaseHold(reservation, ReservationStatus.EXPIRED);
    }
    return toExpire.length;
  }
}
