import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { InfraModule } from '@infra/infra.module';
import { DomainsModule } from '@domains/domains.module';

@Module({
  imports: [CoreModule, InfraModule, DomainsModule],
})
export class AppModule {}
