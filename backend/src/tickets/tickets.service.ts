import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Ticket } from './ticket.entity';
import { Reservation } from '../reservations/reservation.entity';
import { EventEntity } from '../events/event.entity';
import { Seat } from '../events/seat.entity';
import { TicketStatus } from '../common/enums';
import { generateHumanCode, signTicket, TicketQrPayload } from './ticket-signature.util';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketsRepo: Repository<Ticket>,
    private readonly config: ConfigService,
  ) {}

  async issueTicket(
    reservation: Reservation,
    event: EventEntity,
    ownerId: string,
    seat: Seat | null,
  ): Promise<Ticket> {
    const secret = this.config.get<string>('TICKET_QR_SECRET');
    const code = generateHumanCode();
    const id = crypto.randomUUID();
    const signature = signTicket(secret, { id, eventId: event.id, code });

    const ticket = this.ticketsRepo.create({
      id,
      reservationId: reservation.id,
      eventId: event.id,
      ownerId,
      seatId: seat?.id ?? null,
      code,
      signature,
      shareToken: crypto.randomBytes(24).toString('base64url'),
      status: TicketStatus.VALID,
    });
    return this.ticketsRepo.save(ticket);
  }

  async findMine(ownerId: string) {
    return this.ticketsRepo.find({
      where: { ownerId },
      relations: { event: true, seat: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdForOwner(id: string, ownerId: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: { event: true, seat: true },
    });
    if (!ticket) throw new NotFoundException('Ingresso não encontrado.');
    if (ticket.ownerId !== ownerId) {
      throw new ForbiddenException('Este ingresso não pertence a você.');
    }
    return ticket;
  }

  async findByShareToken(token: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { shareToken: token },
      relations: { event: true, seat: true, owner: true },
    });
    if (!ticket) throw new NotFoundException('Link de ingresso inválido.');
    return ticket;
  }

  async buildQrPayload(ticket: Ticket): Promise<TicketQrPayload> {
    return { id: ticket.id, code: ticket.code, sig: ticket.signature };
  }

  async qrCodeDataUrl(ticket: Ticket): Promise<string> {
    const payload = await this.buildQrPayload(ticket);
    return QRCode.toDataURL(JSON.stringify(payload), { margin: 1, width: 320 });
  }

  async findByCode(code: string) {
    return this.ticketsRepo.findOne({
      where: { code: code.toUpperCase() },
      relations: { event: true, seat: true },
    });
  }

  async findByIdRaw(id: string) {
    return this.ticketsRepo.findOne({ where: { id }, relations: { event: true, seat: true } });
  }

  async markUsed(ticket: Ticket, gateUserId: string) {
    ticket.status = TicketStatus.USED;
    ticket.usedAt = new Date();
    ticket.usedByGateId = gateUserId;
    return this.ticketsRepo.save(ticket);
  }
}
