import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { Payment } from '../payments/payment.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsCron } from './reservations.cron';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Payment]), TicketsModule],
  providers: [ReservationsService, ReservationsCron],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {}
