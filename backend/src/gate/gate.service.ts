import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsService } from '../tickets/tickets.service';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { GateCheckResult, TicketStatus } from '../common/enums';
import { verifyTicketSignature } from '../tickets/ticket-signature.util';

@Injectable()
export class GateService {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly config: ConfigService,
  ) {}

  async validate(dto: ValidateTicketDto, gateUserId: string) {
    let ticket = null;

    if (dto.qrPayload) {
      let payload: { id?: string; code?: string; sig?: string };
      try {
        payload = JSON.parse(dto.qrPayload);
      } catch {
        return this.result(GateCheckResult.INVALID, 'QR ilegível.');
      }
      if (!payload.id || !payload.code || !payload.sig) {
        return this.result(GateCheckResult.INVALID, 'QR incompleto.');
      }
      ticket = await this.ticketsService.findByIdRaw(payload.id);
      if (!ticket) return this.result(GateCheckResult.INVALID, 'Ingresso não encontrado.');

      const secret = this.config.get<string>('TICKET_QR_SECRET');
      const valid = verifyTicketSignature(
        secret,
        { id: ticket.id, eventId: ticket.eventId, code: ticket.code },
        payload.sig,
      );
      if (!valid || ticket.code !== payload.code.toUpperCase()) {
        return this.result(GateCheckResult.INVALID, 'Assinatura do QR não confere — ingresso pode ter sido forjado.');
      }
    } else if (dto.code) {
      ticket = await this.ticketsService.findByCode(dto.code);
      if (!ticket) return this.result(GateCheckResult.INVALID, 'Código não encontrado.');
    } else {
      throw new BadRequestException('Informe "code" ou "qrPayload".');
    }

    if (ticket.eventId !== dto.eventId) {
      return this.result(GateCheckResult.WRONG_EVENT, 'Este ingresso é de outro evento.', ticket);
    }
    if (ticket.status === TicketStatus.USED) {
      return this.result(
        GateCheckResult.ALREADY_USED,
        `Ingresso já utilizado em ${ticket.usedAt?.toLocaleString('pt-BR')}.`,
        ticket,
      );
    }
    if (ticket.status === TicketStatus.CANCELLED) {
      return this.result(GateCheckResult.INVALID, 'Ingresso cancelado.', ticket);
    }

    const updated = await this.ticketsService.markUsed(ticket, gateUserId);
    return this.result(GateCheckResult.VALID, 'Ingresso válido. Acesso liberado.', updated);
  }

  private result(result: GateCheckResult, message: string, ticket: any = null) {
    return {
      result,
      message,
      ticket: ticket
        ? {
            code: ticket.code,
            seat: ticket.seat ? `${ticket.seat.row}${ticket.seat.number}` : 'Pista',
            eventTitle: ticket.event?.title,
            status: ticket.status,
          }
        : null,
    };
  }
}
