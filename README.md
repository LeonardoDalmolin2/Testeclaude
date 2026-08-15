# Estúdio de Visagismo — Monorepo (Vue 3 + Vite + NestJS Serverless + Vercel)

App onde a usuária faz uma selfie, responde algumas perguntas e recebe um **dossiê
personalizado de visagismo, colorimetria e maquiagem** em HTML, gerado pela IA da
Anthropic (Claude) com análise de imagem.

- **Frontend:** Vue 3 + Vite + TypeScript (Composition API, `<script setup>`, Vue Router, Pinia)
- **Backend:** NestJS + TypeScript rodando como **Vercel Serverless Function** (Express adapter, sem `app.listen()`)
- **Monorepo:** pnpm workspaces
- **Código compartilhado:** `packages/shared` (`@project/shared`)
- **Deploy:** Vercel

---

## 1. Requisitos

- **Node.js** ≥ 18.18 (LTS)
- **pnpm** ≥ 9 (`npm i -g pnpm` ou via `corepack enable`)
- Uma **`ANTHROPIC_API_KEY`** (https://console.anthropic.com/) para gerar o dossiê

## 2. Instalação

```bash
pnpm install
cp .env.example .env.local   # e preencha ANTHROPIC_API_KEY
```

## 3. Estrutura do projeto

```
.
├── api/
│   └── index.ts            # Vercel Serverless Function (entrypoint de produção)
├── apps/
│   ├── web/                # Frontend Vue 3 + Vite  (@project/web)
│   │   ├── src/
│   │   │   ├── views/      # Home, Selfie, Review, Questions, Generating, Result
│   │   │   ├── stores/     # Pinia (estado do fluxo, imagem só em memória)
│   │   │   ├── api/        # client fetch('/api/*')
│   │   │   └── lib/        # redimensionamento da imagem
│   │   └── vite.config.ts  # proxy /api → NestJS local
│   └── api/                # Backend NestJS  (@project/api)
│       └── src/
│           ├── bootstrap.ts   # cria Express+Nest SEM listen() (reutilizável)
│           ├── main.ts        # DEV ONLY: sobe servidor local p/ o proxy do Vite
│           ├── app.module.ts
│           ├── health/        # GET /api/health
│           └── dossier/       # POST /api/dossier (chama a Claude)
├── packages/
│   └── shared/             # Tipos compartilhados  (@project/shared)
├── vercel.json
├── pnpm-workspace.yaml
└── package.json
```

## 4. Como executar localmente

```bash
pnpm dev
```

Isso builda o `@project/shared` e sobe, em paralelo:

- **Vite** em http://localhost:5173 (frontend)
- **NestJS** em http://localhost:3001 (dev server local)

O frontend chama `/api/*` e o Vite faz **proxy** para o NestJS local — sem CORS.

- App: http://localhost:5173
- Health: http://localhost:5173/api/health → `{ "status": "ok" }`

> Se editar tipos em `packages/shared` durante o `pnpm dev`, rode
> `pnpm --filter @project/shared build` novamente (ou reinicie o `pnpm dev`).

## 5. Como fazer build

```bash
pnpm build       # builda shared → api → web (ordem topológica do pnpm)
pnpm lint
pnpm typecheck
```

## 6. Como funciona o NestJS Serverless

- `apps/api/src/bootstrap.ts` expõe `createServerlessApp()`, que cria uma instância
  **Express + NestJS** e chama `app.init()` — **nunca** `app.listen()`. A instância é
  memoizada em módulo, então enquanto a função permanecer "quente" ela é reutilizada.
- `api/index.ts` (raiz) é a **Vercel Function**. Ela inicializa o Nest de forma lazy e
  repassa `(req, res)` ao Express:

  ```
  HTTP Request → Vercel Function → NestJS → Controller → Response
  ```

- Não há servidor HTTP persistente, worker, WebSocket, fila ou estado em memória como
  mecanismo de persistência.
- **Desenvolvimento local** usa `apps/api/src/main.ts`, que — **somente no dev** — chama
  `listen()` para o proxy do Vite funcionar. Esse arquivo não faz parte do caminho de
  produção.

## 7. Como fazer deploy na Vercel

1. Faça push do repositório para o GitHub/GitLab.
2. Na Vercel, **Add New → Project** e importe o repositório.
3. A Vercel lê o `vercel.json`:
   - `buildCommand: pnpm build`
   - `outputDirectory: apps/web/dist`
   - funções em `api/` são detectadas automaticamente (`@vercel/node`).
4. Em **Settings → Environment Variables**, adicione `ANTHROPIC_API_KEY`
   (e opcionalmente `ANTHROPIC_MODEL`).
5. Deploy. Resultado:
   - `https://<projeto>.vercel.app/` → Vue
   - `https://<projeto>.vercel.app/api/health` → `{ "status": "ok" }`

> As dependências do NestJS são empacotadas pela Vercel a partir de `api/index.ts`,
> que importa `@project/api`. O `pnpm build` gera `apps/api/dist` antes do empacotamento.

## 8. Como o `/api/*` é roteado

- **Local:** proxy do Vite (`apps/web/vite.config.ts`) encaminha `/api` → `http://localhost:3001`.
- **Produção:** o `rewrite` do `vercel.json` (`/api/(.*)` → `/api`) direciona toda
  requisição sob `/api` para a Serverless Function. O NestJS usa `setGlobalPrefix('api')`,
  então `@Controller('health')` responde em `/api/health`.

## 9. Como adicionar novos endpoints no NestJS

1. Crie `apps/api/src/<feature>/<feature>.controller.ts`:

   ```ts
   import { Controller, Get } from '@nestjs/common';

   @Controller('exemplo') // vira /api/exemplo (por causa do globalPrefix 'api')
   export class ExemploController {
     @Get()
     hello() {
       return { hello: 'mundo' };
     }
   }
   ```

2. Registre em `apps/api/src/app.module.ts` (`controllers`/`providers`).
3. Consuma no frontend com `fetch('/api/exemplo')`.

## 10. Como adicionar novos packages compartilhados

1. Crie `packages/<nome>` com `package.json` (`"name": "@project/<nome>"`), `tsconfig.json` e `src/`.
2. Adicione como dependência onde precisar: `"@project/<nome>": "workspace:*"`.
3. `pnpm install` para linkar. Importe via `@project/<nome>`.

---

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

## Notas

- A selfie é redimensionada no cliente (máx. 1024px, JPEG) e trafega em base64 apenas
  para gerar o dossiê. Ela **não é persistida** — fica só em memória (Pinia) durante o fluxo.
- Modelo de IA padrão: `claude-opus-4-8` (com visão). Ajuste via `ANTHROPIC_MODEL`.
