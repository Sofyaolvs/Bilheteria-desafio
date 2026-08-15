import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { EventEntity } from '../events/event.entity';
import { ReservationStatus } from '../common/enums';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING_PAYMENT })
  status: ReservationStatus;

  // Para eventos GENERAL (pista)
  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  totalPrice: string;

  @Column({ name: 'holds_expire_at', type: 'timestamptz' })
  holdsExpireAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
