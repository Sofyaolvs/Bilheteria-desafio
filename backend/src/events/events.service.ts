import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { EventEntity } from './event.entity';
import { Seat } from './seat.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { TicketingMode } from '../common/enums';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity) private readonly eventsRepo: Repository<EventEntity>,
    @InjectRepository(Seat) private readonly seatsRepo: Repository<Seat>,
  ) {}

  async create(organizerId: string, dto: CreateEventDto) {
    if (dto.ticketingMode === TicketingMode.GENERAL && !dto.generalCapacity) {
      throw new BadRequestException(
        'Informe a capacidade (generalCapacity) para eventos por quantidade (pista).',
      );
    }
    if (
      dto.ticketingMode === TicketingMode.SEATED &&
      (!dto.seatRows || !dto.seatsPerRow)
    ) {
      throw new BadRequestException(
        'Informe seatRows e seatsPerRow para eventos com mapa de assentos.',
      );
    }

    const event = this.eventsRepo.create({
      organizerId,
      externalId: dto.externalId ?? null,
      externalSource: dto.externalSource ?? 'manual',
      category: dto.category,
      title: dto.title,
      subtitle: dto.subtitle ?? null,
      imageUrl: dto.imageUrl ?? null,
      description: dto.description ?? null,
      venueName: dto.venueName,
      venueCity: dto.venueCity,
      venueAddress: dto.venueAddress ?? null,
      startsAt: new Date(dto.startsAt),
      ticketingMode: dto.ticketingMode,
      price: dto.price,
      generalCapacity: dto.ticketingMode === TicketingMode.GENERAL ? dto.generalCapacity : null,
      generalAvailable: dto.ticketingMode === TicketingMode.GENERAL ? dto.generalCapacity : null,
      seatRows: dto.ticketingMode === TicketingMode.SEATED ? dto.seatRows : null,
      seatsPerRow: dto.ticketingMode === TicketingMode.SEATED ? dto.seatsPerRow : null,
      published: true,
    });
    const saved = await this.eventsRepo.save(event);

    if (dto.ticketingMode === TicketingMode.SEATED) {
      const seats: Seat[] = [];
      for (let r = 0; r < dto.seatRows; r++) {
        const rowLetter = String.fromCharCode(65 + r); // A, B, C...
        for (let n = 1; n <= dto.seatsPerRow; n++) {
          seats.push(
            this.seatsRepo.create({ eventId: saved.id, row: rowLetter, number: n }),
          );
        }
      }
      await this.seatsRepo.save(seats);
    }

    return saved;
  }

  async listPublished(filters: ListEventsDto) {
    const where: any = { published: true };
    if (filters.q) where.title = ILike(`%${filters.q}%`);
    if (filters.city) where.venueCity = ILike(`%${filters.city}%`);
    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00.000Z`);
      const end = new Date(`${filters.date}T23:59:59.999Z`);
      where.startsAt = Between(start, end);
    }
    return this.eventsRepo.find({ where, order: { startsAt: 'ASC' } });
  }

  async listMine(organizerId: string) {
    return this.eventsRepo.find({
      where: { organizerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOrFail(id: string) {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    return event;
  }

  async findSeatsFor(eventId: string) {
    return this.seatsRepo.find({
      where: { eventId },
      order: { row: 'ASC', number: 'ASC' },
    });
  }

  async assertOwnership(eventId: string, organizerId: string) {
    const event = await this.findOneOrFail(eventId);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Este evento pertence a outro organizador.');
    }
    return event;
  }
}
