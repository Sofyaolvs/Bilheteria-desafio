import type { IncomingMessage, ServerResponse } from 'http';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

// Vercel reaproveita o mesmo processo entre invocações "quentes" — o app Nest
// só é montado uma vez e fica em cache aqui, não a cada request.
let bootstrapPromise: Promise<express.Express> | null = null;

async function bootstrap(): Promise<express.Express> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureApp(app);
  await app.init();
  return server;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap();
    }
    const server = await bootstrapPromise;
    server(req, res);
  } catch (err) {
    // Não deixa uma inicialização quebrada (ex.: DATABASE_URL ausente/errada) em cache —
    // sem isso, todo request seguinte falharia igual até o próximo cold start.
    bootstrapPromise = null;
    // eslint-disable-next-line no-console
    console.error('Falha ao inicializar o app Nest:', err);
    // Sem isso, o crash acontece antes do CORS do Nest ser aplicado, e o navegador
    // reporta "bloqueado por CORS" escondendo o 500 real por trás.
    const origin = req.headers.origin;
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        statusCode: 500,
        message:
          'Erro ao inicializar o servidor. Verifique as variáveis de ambiente (DATABASE_URL etc.) no painel do Vercel.',
      }),
    );
  }
}
