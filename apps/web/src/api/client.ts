import type {
  CheckPhotoRequest,
  CheckPhotoResponse,
  GenerateDossierRequest,
  GenerateDossierResponse,
  HealthResponse,
} from '@project/shared';

const PHOTO_CHECK_TIMEOUT_MS = 25_000;

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

/** Pré-checagem remota de aptidão da foto (com timeout). */
export async function checkPhoto(payload: CheckPhotoRequest): Promise<CheckPhotoResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PHOTO_CHECK_TIMEOUT_MS);

  try {
    const res = await fetch('/api/photo-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return parseError(res);
    return (await res.json()) as CheckPhotoResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('A validação da foto demorou demais. Tente novamente.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
