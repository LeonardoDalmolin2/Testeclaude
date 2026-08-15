import { Body, Controller, Post } from '@nestjs/common';
import type { GenerateDossierRequest, GenerateDossierResponse } from '@project/shared';
import { DossierService } from './dossier.service';

@Controller('dossier')
export class DossierController {
  constructor(private readonly dossier: DossierService) {}

  /** POST /api/dossier → gera o dossiê HTML a partir da selfie + respostas. */
  @Post()
  async generate(@Body() body: GenerateDossierRequest): Promise<GenerateDossierResponse> {
    return this.dossier.generate(body);
  }
}
