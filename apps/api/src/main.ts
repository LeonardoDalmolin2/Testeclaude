/**
 * Entrypoint APENAS para desenvolvimento local (`pnpm dev` → `nest start --watch`).
 *
 * Em produção na Vercel o entrypoint é `/api/index.ts` (Serverless Function),
 * que **não** chama `listen()`. Aqui subimos um servidor local só para que o
 * proxy do Vite (`/api` → http://localhost:3001) funcione durante o dev.
 */
import { config } from 'dotenv';
import { createServerlessApp } from './bootstrap';

// Carrega variáveis a partir da raiz do monorepo e do próprio app (sem sobrescrever).
config();
config({ path: '../../.env.local' });
config({ path: '../../.env' });

async function dev(): Promise<void> {
  const server = await createServerlessApp();
  const port = Number(process.env.PORT ?? 3001);
  server.listen(port, () => {
    console.log(`[api] dev server em http://localhost:${port} — rotas sob /api`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[api] ATENÇÃO: ANTHROPIC_API_KEY não definida. /api/dossier retornará erro.');
    }
  });
}

void dev();
