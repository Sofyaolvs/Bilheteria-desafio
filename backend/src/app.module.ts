import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { User } from './users/user.entity';
import { EventEntity } from './events/event.entity';
import { Seat } from './events/seat.entity';
import { Reservation } from './reservations/reservation.entity';
import { Ticket } from './tickets/ticket.entity';
import { Payment } from './payments/payment.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { CatalogModule } from './catalog/catalog.module';
import { ReservationsModule } from './reservations/reservations.module';
import { TicketsModule } from './tickets/tickets.module';
import { GateModule } from './gate/gate.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, EventEntity, Seat, Reservation, Ticket, Payment],
        synchronize: true, // desafio de 7 dias: sem migrations formais, ver README
        logging: false,
      }),
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    CatalogModule,
    ReservationsModule,
    TicketsModule,
    GateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
