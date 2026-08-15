import type { SupportedImageMediaType } from '@project/shared';

export interface PreparedImage {
  /** data URL para pré-visualização (`data:image/jpeg;base64,...`). */
  dataUrl: string;
  /** Base64 puro, sem o prefixo, pronto para a API. */
  base64: string;
  mediaType: SupportedImageMediaType;
}

const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.85;

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
