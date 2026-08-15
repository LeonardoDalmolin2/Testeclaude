import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DossierController } from './dossier/dossier.controller';
import { DossierService } from './dossier/dossier.service';
import { PhotoCheckController } from './photo-check/photo-check.controller';
import { PhotoCheckService } from './photo-check/photo-check.service';

@Module({
  controllers: [HealthController, DossierController, PhotoCheckController],
  providers: [DossierService, PhotoCheckService],
})
export class AppModule {}
