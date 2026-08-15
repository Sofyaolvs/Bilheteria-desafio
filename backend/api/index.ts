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
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap();
  }
  const server = await bootstrapPromise;
  server(req, res);
}
