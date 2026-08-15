import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return { status: 'ok', service: 'Plataforma de Eventos e Ingressos API' };
  }
}
