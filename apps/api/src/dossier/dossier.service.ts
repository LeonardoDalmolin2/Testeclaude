import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerateDossierRequest,
  GenerateDossierResponse,
  ProfileAnswers,
  SupportedImageMediaType,
} from '@project/shared';
import { VISAGISMO_SYSTEM_PROMPT } from './system-prompt';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8';
const MAX_TOKENS = 8000;
const ALLOWED_MEDIA: readonly SupportedImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class DossierService {
  private readonly logger = new Logger(DossierService.name);

  async generate(req: GenerateDossierRequest): Promise<GenerateDossierResponse> {
    this.validate(req);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      this.logger.error('ANTHROPIC_API_KEY ausente no ambiente.');
      throw new InternalServerErrorException(
        'Serviço de análise indisponível: ANTHROPIC_API_KEY não configurada.',
      );
    }

    const client = new Anthropic({ apiKey });

    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: VISAGISMO_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: req.mediaType, data: req.imageBase64 },
              },
              { type: 'text', text: this.buildUserPrompt(req.answers) },
            ],
          },
        ],
      });

      const text = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return { html: this.extractHtml(text) };
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        this.logger.error(`Erro da API Anthropic (${err.status}): ${err.message}`);
      } else {
        this.logger.error('Falha inesperada ao gerar o dossiê', err as Error);
      }
      throw new InternalServerErrorException('Não foi possível gerar o dossiê no momento.');
    }
  }

  private validate(req: GenerateDossierRequest): void {
    if (!req || typeof req.imageBase64 !== 'string' || req.imageBase64.length < 100) {
      throw new BadRequestException('Imagem ausente ou inválida.');
    }
    if (!ALLOWED_MEDIA.includes(req.mediaType)) {
      throw new BadRequestException('Formato de imagem não suportado (use JPEG, PNG ou WebP).');
    }
    const a = req.answers;
    if (!a || typeof a.age !== 'number' || a.age <= 0) {
      throw new BadRequestException('Respostas do perfil incompletas (idade inválida).');
    }
  }

  private buildUserPrompt(a: ProfileAnswers): string {
    const brands = a.favoriteBrands.length ? a.favoriteBrands.join(', ') : 'sem preferência';
    return [
      'Analise a foto anexada e gere o Dossiê conforme as instruções do sistema.',
      'Retorne EXCLUSIVAMENTE o documento HTML completo, começando em <!DOCTYPE html>.',
      '',
      '[DADOS DA CLIENTE]',
      `- Idade: ${a.age}`,
      `- Tipo de pele informado: ${a.skinType}`,
      `- Preferência de estilo: ${a.stylePreference}`,
      `- Marcas de preferência: ${brands}`,
      `- Objetivo principal: ${a.mainGoal}`,
    ].join('\n');
  }

  /** Remove eventuais cercas markdown que o modelo possa incluir por engano. */
  private extractHtml(text: string): string {
    const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : text;
    return candidate.trim();
  }
}
