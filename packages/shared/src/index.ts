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

/** Motivos tipados de rejeição da pré-checagem de foto. */
export type PhotoRejectReason =
  | 'no_face'
  | 'multiple_faces'
  | 'face_cropped'
  | 'not_frontal'
  | 'too_blurry'
  | 'too_dark'
  | 'too_bright'
  | 'uneven_lighting'
  | 'obstructed'
  | 'strong_filter'
  | 'too_far'
  | 'too_close'
  | 'low_resolution'
  | 'invalid_image'
  | 'service_unavailable';

export const PHOTO_REJECT_REASONS: readonly PhotoRejectReason[] = [
  'no_face',
  'multiple_faces',
  'face_cropped',
  'not_frontal',
  'too_blurry',
  'too_dark',
  'too_bright',
  'uneven_lighting',
  'obstructed',
  'strong_filter',
  'too_far',
  'too_close',
  'low_resolution',
  'invalid_image',
  'service_unavailable',
] as const;

/** Orientações padrão em português por motivo de rejeição. */
export const PHOTO_REJECT_GUIDANCE: Readonly<Record<PhotoRejectReason, string>> = {
  no_face: 'Não encontramos um rosto nítido. Centralize o rosto e tire outra foto.',
  multiple_faces: 'Aparece mais de uma pessoa. Tire a selfie sozinha, com o rosto em destaque.',
  face_cropped: 'O rosto está cortado. Afaste um pouco e enquadre o rosto inteiro.',
  not_frontal: 'O rosto não está de frente. Olhe para a câmera e tire outra foto.',
  too_blurry: 'A foto está desfocada. Segure o celular firme e tire outra.',
  too_dark: 'A foto está escura demais. Procure mais luz natural ou uma lâmpada frontal.',
  too_bright: 'A foto está estourada de luz. Evite contra-luz forte e tire outra.',
  uneven_lighting: 'A iluminação está irregular. Use luz uniforme no rosto e tire outra foto.',
  obstructed: 'Há algo cobrindo o rosto. Remova óculos escuros, máscara ou cabelo na frente.',
  strong_filter: 'Há filtro ou efeito forte. Tire uma selfie natural, sem filtros.',
  too_far: 'O rosto está longe demais. Aproxime-se um pouco e centralize o rosto.',
  too_close: 'O rosto está muito perto. Afaste um pouco para caber o rosto inteiro.',
  low_resolution: 'A imagem está com baixa qualidade. Tire outra foto com melhor resolução.',
  invalid_image: 'Não foi possível ler a imagem. Tire outra foto e tente novamente.',
  service_unavailable:
    'Não foi possível validar a foto agora. Tire outra foto ou tente novamente em instantes.',
};

/** Corpo enviado para pré-checagem de aptidão da foto. */
export interface CheckPhotoRequest {
  /** Imagem em base64 (SEM o prefixo `data:...;base64,`). */
  imageBase64: string;
  mediaType: SupportedImageMediaType;
}

/** Resposta da pré-checagem de aptidão da foto. */
export interface CheckPhotoResponse {
  /** true se a foto está apta para a análise de visagismo. */
  approved: boolean;
  /** Códigos tipados dos problemas encontrados (vazio se aprovada). */
  reasons: PhotoRejectReason[];
  /** Orientação objetiva em português para a usuária. */
  guidance: string;
}
