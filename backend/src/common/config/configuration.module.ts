import { Global, Module } from '@nestjs/common';
import type { AppConfiguration } from './configuration.js';

export const APP_CONFIGURATION = Symbol('APP_CONFIGURATION');

@Global()
@Module({})
export class AppConfigurationModule {
  static register(configuration: AppConfiguration) {
    return {
      module: AppConfigurationModule,
      providers: [{ provide: APP_CONFIGURATION, useValue: configuration }],
      exports: [APP_CONFIGURATION]
    };
  }
}
