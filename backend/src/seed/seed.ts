import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { EventEntity } from '../events/event.entity';
import { Seat } from '../events/seat.entity';
import { Reservation } from '../reservations/reservation.entity';
import { Ticket } from '../tickets/ticket.entity';
import { Payment } from '../payments/payment.entity';
import {
  EventCategory,
  PaymentStatus,
  ReservationStatus,
  SeatStatus,
  TicketStatus,
  TicketingMode,
  UserRole,
} from '../common/enums';
import { generateHumanCode, signTicket } from '../tickets/ticket-signature.util';

const SEED_PASSWORD = 'senha123';

async function upsertUser(
  ds: DataSource,
  name: string,
  email: string,
  role: UserRole,
): Promise<User> {
  const repo = ds.getRepository(User);
  let user = await repo.findOne({ where: { email } });
  if (!user) {
    user = repo.create({
      name,
      email,
      passwordHash: await bcrypt.hash(SEED_PASSWORD, 10),
      role,
    });
    user = await repo.save(user);
    console.log(`  + criado ${role}: ${email} / ${SEED_PASSWORD}`);
  } else {
    console.log(`  = já existia ${role}: ${email}`);
  }
  return user;
}

function issueTicketSync(params: {
  reservationId: string;
  eventId: string;
  ownerId: string;
  seatId: string | null;
  secret: string;
}) {
  const id = crypto.randomUUID();
  const code = generateHumanCode();
  const signature = signTicket(params.secret, { id, eventId: params.eventId, code });
  return {
    id,
    reservationId: params.reservationId,
    eventId: params.eventId,
    ownerId: params.ownerId,
    seatId: params.seatId,
    code,
    signature,
    shareToken: crypto.randomBytes(24).toString('base64url'),
    status: TicketStatus.VALID,
  };
}

async function main() {
  const secret = process.env.TICKET_QR_SECRET || 'seed-secret';
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, EventEntity, Seat, Reservation, Ticket, Payment],
    synchronize: true,
  });
  await ds.initialize();
  console.log('Conectado ao banco. Semeando dados de teste...\n');

  console.log('Usuários:');
  const organizer = await upsertUser(ds, 'Ana Organizadora', 'organizador@demo.com', UserRole.ORGANIZER);
  const client1 = await upsertUser(ds, 'Carlos Cliente', 'cliente1@demo.com', UserRole.CLIENT);
  const client2 = await upsertUser(ds, 'Beatriz Cliente', 'cliente2@demo.com', UserRole.CLIENT);
  const gate = await upsertUser(ds, 'Portaria Principal', 'portaria@demo.com', UserRole.GATE);

  const eventsRepo = ds.getRepository(EventEntity);
  const seatsRepo = ds.getRepository(Seat);
  const reservationsRepo = ds.getRepository(Reservation);
  const ticketsRepo = ds.getRepository(Ticket);
  const paymentsRepo = ds.getRepository(Payment);

  const in7days = new Date();
  in7days.setDate(in7days.getDate() + 7);
  const in14days = new Date();
  in14days.setDate(in14days.getDate() + 14);

  console.log('\nEventos:');
  let seatedEvent = await eventsRepo.findOne({ where: { title: 'Sessão Especial: Filme Demo' } });
  if (!seatedEvent) {
    seatedEvent = await eventsRepo.save(
      eventsRepo.create({
        organizerId: organizer.id,
        externalSource: 'local',
        externalId: 'local-seed-filme',
        category: EventCategory.FILME,
        title: 'Sessão Especial: Filme Demo',
        subtitle: 'Pré-estreia com sessão de perguntas',
        imageUrl: 'https://picsum.photos/seed/filme-demo/800/450',
        description: 'Evento semeado automaticamente para avaliação do desafio.',
        venueName: 'Cine Elite Sala 3',
        venueCity: 'São Paulo',
        venueAddress: 'Av. Paulista, 1000',
        startsAt: in7days,
        ticketingMode: TicketingMode.SEATED,
        price: '45.00',
        seatRows: 5,
        seatsPerRow: 8,
        published: true,
      }),
    );
    const seats: Seat[] = [];
    for (let r = 0; r < 5; r++) {
      const row = String.fromCharCode(65 + r);
      for (let n = 1; n <= 8; n++) {
        seats.push(seatsRepo.create({ eventId: seatedEvent.id, row, number: n }));
      }
    }
    await seatsRepo.save(seats);
    console.log(`  + criado evento com assentos: ${seatedEvent.title} (${seats.length} lugares)`);
  } else {
    console.log(`  = já existia: ${seatedEvent.title}`);
  }

  let generalEvent = await eventsRepo.findOne({ where: { title: 'Show Demo: Noite Eletrônica' } });
  if (!generalEvent) {
    generalEvent = await eventsRepo.save(
      eventsRepo.create({
        organizerId: organizer.id,
        externalSource: 'local',
        externalId: 'local-seed-show',
        category: EventCategory.SHOW,
        title: 'Show Demo: Noite Eletrônica',
        subtitle: 'Pista única, evento semeado para avaliação',
        imageUrl: 'https://picsum.photos/seed/show-demo/800/450',
        description: 'Evento semeado automaticamente para avaliação do desafio.',
        venueName: 'Arena Elite',
        venueCity: 'Rio de Janeiro',
        venueAddress: 'Av. Atlântica, 500',
        startsAt: in14days,
        ticketingMode: TicketingMode.GENERAL,
        price: '90.00',
        generalCapacity: 200,
        generalAvailable: 200,
        published: true,
      }),
    );
    console.log(`  + criado evento de pista: ${generalEvent.title} (200 ingressos)`);
  } else {
    console.log(`  = já existia: ${generalEvent.title}`);
  }

  // Já deixa 2 assentos vendidos + 2 ingressos de pista vendidos, para que
  // dê para testar a portaria sem precisar passar pelo checkout primeiro.
  const existingTickets = await ticketsRepo.count();
  if (existingTickets === 0) {
    console.log('\nIngressos de demonstração (prontos para testar a portaria):');

    // --- Assento no evento com mapa ---
    const [seatA1, seatA2] = await seatsRepo.find({
      where: { eventId: seatedEvent.id },
      order: { row: 'ASC', number: 'ASC' },
      take: 2,
    });
    const seatedReservation = await reservationsRepo.save(
      reservationsRepo.create({
        eventId: seatedEvent.id,
        clientId: client1.id,
        status: ReservationStatus.PAID,
        quantity: null,
        totalPrice: (Number(seatedEvent.price) * 2).toFixed(2),
        holdsExpireAt: new Date(),
      }),
    );
    await paymentsRepo.save(
      paymentsRepo.create({
        reservationId: seatedReservation.id,
        cardHolder: 'Carlos Cliente',
        cardLast4: '4242',
        status: PaymentStatus.APPROVED,
      }),
    );
    for (const seat of [seatA1, seatA2]) {
      seat.status = SeatStatus.SOLD;
      seat.reservationId = seatedReservation.id;
      seat.heldUntil = null;
      await seatsRepo.save(seat);
      const t = issueTicketSync({
        reservationId: seatedReservation.id,
        eventId: seatedEvent.id,
        ownerId: client1.id,
        seatId: seat.id,
        secret,
      });
      await ticketsRepo.save(ticketsRepo.create(t));
      console.log(`  + ingresso assento ${seat.row}${seat.number} para cliente1 — código: ${t.code}`);
    }

    // --- Pista no evento de show ---
    const generalReservation = await reservationsRepo.save(
      reservationsRepo.create({
        eventId: generalEvent.id,
        clientId: client2.id,
        status: ReservationStatus.PAID,
        quantity: 2,
        totalPrice: (Number(generalEvent.price) * 2).toFixed(2),
        holdsExpireAt: new Date(),
      }),
    );
    await paymentsRepo.save(
      paymentsRepo.create({
        reservationId: generalReservation.id,
        cardHolder: 'Beatriz Cliente',
        cardLast4: '1881',
        status: PaymentStatus.APPROVED,
      }),
    );
    generalEvent.generalAvailable = (generalEvent.generalAvailable ?? 200) - 2;
    await eventsRepo.save(generalEvent);
    for (let i = 0; i < 2; i++) {
      const t = issueTicketSync({
        reservationId: generalReservation.id,
        eventId: generalEvent.id,
        ownerId: client2.id,
        seatId: null,
        secret,
      });
      await ticketsRepo.save(ticketsRepo.create(t));
      console.log(`  + ingresso de pista para cliente2 — código: ${t.code}`);
    }
  } else {
    console.log('\n= ingressos de demonstração já existiam, nada a fazer.');
  }

  console.log('\nPronto! Credenciais de teste (todas com senha "senha123"):');
  console.log(`  Organizador: ${organizer.email}`);
  console.log(`  Cliente 1:   ${client1.email}`);
  console.log(`  Cliente 2:   ${client2.email}`);
  console.log(`  Portaria:    ${gate.email}`);

  await ds.destroy();
}

main().catch((err) => {
  console.error('Erro ao semear banco de dados:', err);
  process.exit(1);
});
