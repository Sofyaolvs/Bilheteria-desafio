import { Controller, Get, NotFoundException, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser, JwtUser } from '../auth/current-user.decorator';
import { TicketsService } from './tickets.service';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('me/tickets')
  async myTickets(@CurrentUser() user: JwtUser) {
    const tickets = await this.ticketsService.findMine(user.userId);
    return Promise.all(
      tickets.map(async (ticket) => ({
        ...ticket,
        qrCode: await this.ticketsService.qrCodeDataUrl(ticket),
        shareUrl: `/t/${ticket.shareToken}`,
      })),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('tickets/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const ticket = await this.ticketsService.findByIdForOwner(id, user.userId);
    const qrCode = await this.ticketsService.qrCodeDataUrl(ticket);
    return { ...ticket, qrCode, shareUrl: `/t/${ticket.shareToken}` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('tickets/:id/qrcode.png')
  async qrImage(@Param('id') id: string, @CurrentUser() user: JwtUser, @Res() res: Response) {
    const ticket = await this.ticketsService.findByIdForOwner(id, user.userId);
    const payload = await this.ticketsService.buildQrPayload(ticket);
    const QRCode = await import('qrcode');
    const buffer = await QRCode.toBuffer(JSON.stringify(payload), { width: 320, margin: 1 });
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  }

  // Rota pública (sem autenticação) para o link de compartilhamento do ingresso.
  @Get('tickets/shared/:token')
  async shared(@Param('token') token: string) {
    const ticket = await this.ticketsService.findByShareToken(token);
    if (!ticket) throw new NotFoundException();
    return {
      eventTitle: ticket.event.title,
      venueName: ticket.event.venueName,
      startsAt: ticket.event.startsAt,
      ownerFirstName: ticket.owner?.name?.split(' ')[0] ?? 'Convidado',
      seat: ticket.seat ? `${ticket.seat.row}${ticket.seat.number}` : 'Pista',
      status: ticket.status,
      code: ticket.code,
    };
  }
}
