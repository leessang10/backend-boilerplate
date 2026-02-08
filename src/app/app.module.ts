import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from '@core/core.module';
import { InfraModule } from '@infra/infra.module';
import { DomainsModule } from '@domains/domains.module';

@Module({
  imports: [CoreModule, InfraModule, DomainsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
