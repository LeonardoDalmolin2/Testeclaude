import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DossierController } from './dossier/dossier.controller';
import { DossierService } from './dossier/dossier.service';

@Module({
  controllers: [HealthController, DossierController],
  providers: [DossierService],
})
export class AppModule {}
