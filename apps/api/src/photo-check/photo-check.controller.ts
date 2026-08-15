import { Body, Controller, Post } from '@nestjs/common';
import type { CheckPhotoRequest, CheckPhotoResponse } from '@project/shared';
import { PhotoCheckService } from './photo-check.service';

@Controller('photo-check')
export class PhotoCheckController {
  constructor(private readonly photoCheck: PhotoCheckService) {}

  /** POST /api/photo-check → valida se a selfie está apta para análise. */
  @Post()
  async check(@Body() body: CheckPhotoRequest): Promise<CheckPhotoResponse> {
    return this.photoCheck.check(body);
  }
}
