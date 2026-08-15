import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';

// Sem isso, um cliente que abandona o checkout deixaria o assento (ou vaga
// de pista) "presa" para sempre. A cada minuto liberamos reservas pendentes
// cujo prazo de 10 minutos expirou.
@Injectable()
export class ReservationsCron {
  private readonly logger = new Logger(ReservationsCron.name);

  constructor(private readonly reservationsService: ReservationsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpirations() {
    const count = await this.reservationsService.expireAllOverdue();
    if (count > 0) {
      this.logger.log(`${count} reserva(s) expirada(s) e devolvida(s) ao estoque.`);
    }
  }
}
