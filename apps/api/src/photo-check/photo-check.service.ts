import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  CheckPhotoRequest,
  CheckPhotoResponse,
  PhotoRejectReason,
  SupportedImageMediaType,
} from '@project/shared';
import { PHOTO_REJECT_GUIDANCE, PHOTO_REJECT_REASONS } from '@project/shared';
import { PHOTO_CHECK_SYSTEM_PROMPT, PHOTO_CHECK_USER_PROMPT } from './photo-check.prompt';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8';
const MAX_TOKENS = 300;
const ALLOWED_MEDIA: readonly SupportedImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_REASON_SET = new Set<string>(PHOTO_REJECT_REASONS);

@Injectable()
export class PhotoCheckService {
  private readonly logger = new Logger(PhotoCheckService.name);

  async check(req: CheckPhotoRequest): Promise<CheckPhotoResponse> {
    this.validate(req);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      this.logger.error('ANTHROPIC_API_KEY ausente no ambiente.');
      throw new InternalServerErrorException(
        'Serviço de validação indisponível: ANTHROPIC_API_KEY não configurada.',
      );
    }

    const client = new Anthropic({ apiKey });

    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: PHOTO_CHECK_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: req.mediaType, data: req.imageBase64 },
              },
              { type: 'text', text: PHOTO_CHECK_USER_PROMPT },
            ],
          },
        ],
      });

      const text = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return this.parseModelResponse(text);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) {
        throw err;
      }
      if (err instanceof Anthropic.APIError) {
        this.logger.error(`Erro da API Anthropic na pré-checagem (${err.status}): ${err.message}`);
      } else {
        this.logger.error('Falha inesperada na pré-checagem da foto', err as Error);
      }
      throw new InternalServerErrorException('Não foi possível validar a foto no momento.');
    }
  }

  private validate(req: CheckPhotoRequest): void {
    if (!req || typeof req.imageBase64 !== 'string' || req.imageBase64.length < 100) {
      throw new BadRequestException('Imagem ausente ou inválida.');
    }
    if (!ALLOWED_MEDIA.includes(req.mediaType)) {
      throw new BadRequestException('Formato de imagem não suportado (use JPEG, PNG ou WebP).');
    }
  }

  private parseModelResponse(text: string): CheckPhotoResponse {
    const jsonText = this.extractJson(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      this.logger.error(`Resposta da pré-checagem não é JSON válido: ${text.slice(0, 200)}`);
      throw new InternalServerErrorException('Não foi possível validar a foto no momento.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new InternalServerErrorException('Não foi possível validar a foto no momento.');
    }

    const obj = parsed as Record<string, unknown>;
    const approved = obj.approved === true;
    const reasons = this.normalizeReasons(obj.reasons);
    const modelGuidance = typeof obj.guidance === 'string' ? obj.guidance.trim() : '';

    if (approved) {
      return {
        approved: true,
        reasons: [],
        guidance: modelGuidance || 'Foto apta para análise.',
      };
    }

    const finalReasons: PhotoRejectReason[] =
      reasons.length > 0 ? reasons : ['invalid_image'];

    return {
      approved: false,
      reasons: finalReasons,
      guidance: this.buildGuidance(finalReasons, modelGuidance),
    };
  }

  private extractJson(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return fenced[1].trim();

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return text.slice(start, end + 1).trim();

    return text.trim();
  }

  private normalizeReasons(raw: unknown): PhotoRejectReason[] {
    if (!Array.isArray(raw)) return [];
    const out: PhotoRejectReason[] = [];
    for (const item of raw) {
      if (typeof item !== 'string') continue;
      if (!ALLOWED_REASON_SET.has(item)) continue;
      if (item === 'service_unavailable') continue;
      const reason = item as PhotoRejectReason;
      if (!out.includes(reason)) out.push(reason);
      if (out.length >= 3) break;
    }
    return out;
  }

  private buildGuidance(reasons: PhotoRejectReason[], modelGuidance: string): string {
    const primary = reasons[0] ?? 'invalid_image';
    const fallback = PHOTO_REJECT_GUIDANCE[primary];
    if (!modelGuidance) return fallback;
    // Aceita orientação do modelo se for curta e em português; senão usa mensagem controlada.
    if (modelGuidance.length > 180) return fallback;
    return modelGuidance;
  }
}
