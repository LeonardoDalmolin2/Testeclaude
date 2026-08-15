import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@project/shared';

@Controller('health')
export class HealthController {
  /** GET /api/health → { "status": "ok" } */
  @Get()
  health(): HealthResponse {
    return { status: 'ok' };
  }
}
