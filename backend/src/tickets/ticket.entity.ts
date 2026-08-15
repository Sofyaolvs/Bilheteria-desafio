import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { EventEntity } from '../events/event.entity';
import { Reservation } from '../reservations/reservation.entity';
import { Seat } from '../events/seat.entity';
import { TicketStatus } from '../common/enums';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  // null para ingressos de pista (GENERAL)
  @ManyToOne(() => Seat, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat | null;

  @Column({ name: 'seat_id', nullable: true })
  seatId: string | null;

  // Código público, curto, usado para digitação manual na portaria
  @Column({ unique: true })
  code: string;

  // Assinatura HMAC do código + evento + dono, para que o QR não possa ser forjado
  @Column()
  signature: string;

  // Token opaco usado para o link público de compartilhamento
  @Column({ name: 'share_token', unique: true })
  shareToken: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.VALID })
  status: TicketStatus;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'used_by_gate_id', nullable: true })
  usedByGateId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
