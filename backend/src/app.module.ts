import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigurationModule } from './common/config/configuration.module.js';
import type { AppConfiguration } from './common/config/configuration.js';
import { DatabaseModule } from './common/database/database.module.js';
import { SecurityModule } from './common/security/security.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { WorkspacesModule } from './modules/workspaces/workspaces.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { NetworkModule } from './modules/network/network.module.js';
import { PartnerOnboardingModule } from './modules/partner-onboarding/partner-onboarding.module.js';
import { PartnersModule } from './modules/partners/partners.module.js';
import { AdminPartnersModule } from './modules/admin-partners/admin-partners.module.js';
import { CampaignsModule } from './modules/campaigns/campaigns.module.js';

@Module({})
export class AppModule {
  static register(configuration: AppConfiguration) {
    return {
      module: AppModule,
      imports: [
        AppConfigurationModule.register(configuration), DatabaseModule, SecurityModule,
        ThrottlerModule.forRoot([{ ttl: configuration.rateLimit.ttlMs, limit: configuration.rateLimit.max }]),
        HealthModule, AuthModule, WorkspacesModule, OrganizationsModule, NetworkModule,
        PartnerOnboardingModule, PartnersModule, AdminPartnersModule, CampaignsModule
      ],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
    };
  }
}
