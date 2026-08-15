import type {
  GenerateDossierRequest,
  GenerateDossierResponse,
  HealthResponse,
} from '@project/shared';

async function parseError(res: Response): Promise<never> {
  let message = `Erro ${res.status}`;
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
  } catch {
    // corpo não-JSON: mantém a mensagem padrão
  }
  throw new Error(message);
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) return parseError(res);
  return (await res.json()) as HealthResponse;
}

export async function generateDossier(
  payload: GenerateDossierRequest,
): Promise<GenerateDossierResponse> {
  const res = await fetch('/api/dossier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as GenerateDossierResponse;
}
