import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { EventCategory, TicketingMode } from '../common/enums';
import { Seat } from './seat.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ name: 'organizer_id' })
  organizerId: string;

  // Dados vindos do catálogo externo (Ticketmaster Discovery API)
  @Column({ name: 'external_source', default: 'ticketmaster' })
  externalSource: string;

  @Column({ name: 'external_id', nullable: true })
  externalId: string | null;

  @Column({ type: 'enum', enum: EventCategory, default: EventCategory.SHOW })
  category: EventCategory;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string | null;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Definidos pelo organizador ao montar o evento
  @Column({ name: 'venue_name' })
  venueName: string;

  @Column({ name: 'venue_city' })
  venueCity: string;

  @Column({ name: 'venue_address', nullable: true })
  venueAddress: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'enum', enum: TicketingMode })
  ticketingMode: TicketingMode;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  // Usado apenas no modo GENERAL (pista)
  @Column({ name: 'general_capacity', type: 'int', nullable: true })
  generalCapacity: number | null;

  @Column({ name: 'general_available', type: 'int', nullable: true })
  generalAvailable: number | null;

  // Usado apenas no modo SEATED (mapa simples fileiras x poltronas)
  @Column({ name: 'seat_rows', type: 'int', nullable: true })
  seatRows: number | null;

  @Column({ name: 'seats_per_row', type: 'int', nullable: true })
  seatsPerRow: number | null;

  @Column({ default: true })
  published: boolean;

  @OneToMany(() => Seat, (seat) => seat.event)
  seats: Seat[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
