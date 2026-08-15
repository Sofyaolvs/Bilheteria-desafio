import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PayReservationDto } from './dto/pay-reservation.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('events/:eventId/reservations')
  create(
    @Param('eventId') eventId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user.userId, eventId, dto);
  }

  @Get('me/reservations')
  mine(@CurrentUser() user: JwtUser) {
    return this.reservationsService.findMine(user.userId);
  }

  @Get('reservations/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.reservationsService.findOneForClient(id, user.userId);
  }

  @Post('reservations/:id/pay')
  pay(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: PayReservationDto) {
    return this.reservationsService.pay(id, user.userId, dto);
  }

  @Delete('reservations/:id')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.reservationsService.cancel(id, user.userId);
  }
}
