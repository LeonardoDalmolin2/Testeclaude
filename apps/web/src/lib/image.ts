import type {
  CheckPhotoResponse,
  PhotoRejectReason,
  SupportedImageMediaType,
} from '@project/shared';
import { PHOTO_REJECT_GUIDANCE } from '@project/shared';

export interface PreparedImage {
  /** data URL para pré-visualização (`data:image/jpeg;base64,...`). */
  dataUrl: string;
  /** Base64 puro, sem o prefixo, pronto para a API. */
  base64: string;
  mediaType: SupportedImageMediaType;
}

const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.85;

/** Limiares locais conservadores — só rejeitam casos óbvios. */
const MIN_SIDE = 240;
const MIN_MEAN_LUMA = 45;
const MAX_MEAN_LUMA = 230;
const MIN_SHARPNESS = 8;
const SAMPLE_SIZE = 96;

/**
 * Redimensiona (para no máx. 1024px no maior lado) e recomprime a imagem em JPEG.
 * Mantém o payload pequeno o suficiente para o corpo da função serverless.
 */
export async function prepareImage(source: Blob | HTMLVideoElement): Promise<PreparedImage> {
  const { width, height, draw } = await toDrawable(source);

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível neste dispositivo.');
  draw(ctx, w, h);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1] ?? '';
  return { dataUrl, base64, mediaType: 'image/jpeg' };
}

/**
 * Pré-validação instantânea (sem IA): dimensões, luminosidade e nitidez aproximada.
 * Não detecta rosto — apenas elimina casos óbvios antes da chamada remota.
 */
export async function checkImageLocally(dataUrl: string): Promise<CheckPhotoResponse> {
  try {
    const { width, height, pixels } = await sampleImage(dataUrl);
    const reasons: PhotoRejectReason[] = [];

    if (width < MIN_SIDE || height < MIN_SIDE) {
      reasons.push('low_resolution');
    }

    const stats = computeLumaStats(pixels);
    if (stats.mean < MIN_MEAN_LUMA) reasons.push('too_dark');
    else if (stats.mean > MAX_MEAN_LUMA) reasons.push('too_bright');
    else if (stats.contrast < 18) reasons.push('uneven_lighting');

    if (stats.sharpness < MIN_SHARPNESS && !reasons.includes('too_dark')) {
      reasons.push('too_blurry');
    }

    if (reasons.length === 0) {
      return { approved: true, reasons: [], guidance: 'Qualidade básica OK.' };
    }

    const primary = reasons[0]!;
    return {
      approved: false,
      reasons,
      guidance: PHOTO_REJECT_GUIDANCE[primary],
    };
  } catch {
    return {
      approved: false,
      reasons: ['invalid_image'],
      guidance: PHOTO_REJECT_GUIDANCE.invalid_image,
    };
  }
}

interface Drawable {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

async function toDrawable(source: Blob | HTMLVideoElement): Promise<Drawable> {
  if (source instanceof HTMLVideoElement) {
    return {
      width: source.videoWidth,
      height: source.videoHeight,
      draw: (ctx, w, h) => ctx.drawImage(source, 0, 0, w, h),
    };
  }

  const bitmap = await createImageBitmap(source);
  return {
    width: bitmap.width,
    height: bitmap.height,
    draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
  };
}

interface SampledImage {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

async function sampleImage(dataUrl: string): Promise<SampledImage> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D indisponível neste dispositivo.');
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  return { width: img.naturalWidth, height: img.naturalHeight, pixels: data };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem.'));
    img.src = dataUrl;
  });
}

interface LumaStats {
  mean: number;
  contrast: number;
  sharpness: number;
}

function computeLumaStats(pixels: Uint8ClampedArray): LumaStats {
  const count = pixels.length / 4;
  if (count === 0) return { mean: 0, contrast: 0, sharpness: 0 };

  let sum = 0;
  let sumSq = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  let prevLuma = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    // Luminância perceptiva aproximada
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += luma;
    sumSq += luma * luma;

    if (i > 0) {
      edgeSum += Math.abs(luma - prevLuma);
      edgeCount += 1;
    }
    prevLuma = luma;
  }

  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  const contrast = Math.sqrt(variance);
  const sharpness = edgeCount > 0 ? edgeSum / edgeCount : 0;

  return { mean, contrast, sharpness };
}
