import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { SeatStatus } from '../common/enums';

@Entity('seats')
@Index(['event', 'row', 'number'], { unique: true })
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventEntity, (event) => event.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column()
  row: string; // A, B, C...

  @Column()
  number: number; // 1, 2, 3...

  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status: SeatStatus;

  // Reserva que atualmente detém (hold) ou comprou este assento.
  @Column({ name: 'reservation_id', nullable: true })
  reservationId: string | null;

  // Usado para expirar holds automaticamente (evita assento "preso" para sempre)
  @Column({ name: 'held_until', type: 'timestamptz', nullable: true })
  heldUntil: Date | null;
}
