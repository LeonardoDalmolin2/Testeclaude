import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServerlessApp } from '@project/api';

/**
 * Vercel Serverless Function — entrypoint de PRODUÇÃO.
 *
 * HTTP Request → Vercel Function → NestJS → Controller → Response
 *
 * O NestJS é inicializado de forma lazy e a instância Express é memoizada
 * dentro de `createServerlessApp()`, sendo reutilizada enquanto a mesma
 * função permanecer "quente". Não há `app.listen()` nem servidor persistente:
 * a Vercel nos entrega (req, res) e apenas repassamos ao Express do Nest.
 */
let expressHandler: ((req: VercelRequest, res: VercelResponse) => void) | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!expressHandler) {
    const app = await createServerlessApp();
    expressHandler = app as unknown as (req: VercelRequest, res: VercelResponse) => void;
  }
  expressHandler(req, res);
}
