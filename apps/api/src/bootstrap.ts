import 'reflect-metadata';
import express from 'express';
import type { Express } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let cached: Express | undefined;

/**
 * Cria a instância Express + NestJS **sem** chamar `listen()`.
 *
 * É usada tanto pela Vercel Function de produção (`/api/index.ts`) quanto
 * pelo servidor de desenvolvimento local (`main.ts`). A instância é memoizada
 * para ser reutilizada entre invocações enquanto a função estiver "quente".
 *
 * O body-parser padrão do Nest é desativado para configurarmos manualmente
 * um limite maior de JSON (a selfie chega em base64 no corpo da requisição).
 */
export async function createServerlessApp(): Promise<Express> {
  if (cached) return cached;

  const server = express();
  server.use(express.json({ limit: '12mb' }));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: false,
    logger: ['error', 'warn', 'log'],
  });

  // Todas as rotas ficam sob /api (ex.: /api/health, /api/dossier).
  app.setGlobalPrefix('api');

  await app.init();

  cached = server;
  return server;
}
