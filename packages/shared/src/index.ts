/**
 * Tipos compartilhados entre o frontend (Vue) e o backend (NestJS).
 * Importe via `@project/shared`. NÃO duplique estes tipos nos apps.
 */

/** Resposta do endpoint de health-check. */
export interface HealthResponse {
  status: string;
}

/** Tipos de pele aceitos no questionário. */
export type SkinType = 'oleosa' | 'seca' | 'mista' | 'normal' | 'sensivel';

export const SKIN_TYPES: readonly SkinType[] = [
  'oleosa',
  'seca',
  'mista',
  'normal',
  'sensivel',
] as const;

/** Formatos de imagem aceitos pela análise de visagismo. */
export type SupportedImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

/** Respostas do perfil informadas pela usuária. */
export interface ProfileAnswers {
  /** Idade em anos. */
  age: number;
  skinType: SkinType;
  /** Preferência de estilo (ex.: "Elegante / Natural Sofisticado"). */
  stylePreference: string;
  /** Marcas de preferência (ex.: ["Sephora", "Fenty"]). */
  favoriteBrands: string[];
  /** Objetivo principal com a maquiagem. */
  mainGoal: string;
}

/** Corpo enviado para gerar o dossiê. */
export interface GenerateDossierRequest {
  /** Imagem em base64 (SEM o prefixo `data:...;base64,`). */
  imageBase64: string;
  mediaType: SupportedImageMediaType;
  answers: ProfileAnswers;
}

/** Resposta com o dossiê pronto. */
export interface GenerateDossierResponse {
  /** Documento HTML completo (com <style> embutido). */
  html: string;
}
