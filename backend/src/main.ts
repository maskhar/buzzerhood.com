import 'reflect-metadata';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import type { FastifyRequest } from 'fastify';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { loadConfiguration } from './common/config/configuration.js';
import { ApiExceptionFilter } from './common/errors/api-exception.filter.js';
import { requestIdFromHeader, REDACT_PATHS } from './common/logging/logging.js';

async function bootstrap(): Promise<void> {
  try {
    console.log('[Bootstrap] Loading configuration...');
    const config = loadConfiguration();
    console.log('[Bootstrap] Creating Fastify adapter...');
    const adapter = new FastifyAdapter({ logger: { level: config.logLevel, redact: [...REDACT_PATHS], genReqId: (request: FastifyRequest) => requestIdFromHeader(request.headers['x-request-id']) } });
    console.log('[Bootstrap] Creating NestJS application...');
    const app = await NestFactory.create<NestFastifyApplication>(AppModule.register(config), adapter);
    console.log('[Bootstrap] Registering plugins...');
    await app.register(cookie);
    await app.register(helmet, config.swaggerEnabled ? { contentSecurityPolicy: false } : {});
    console.log('[Bootstrap] Configuring CORS...');
    app.enableCors({ origin: [...config.corsOrigins], credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'], exposedHeaders: ['X-Request-ID'] });
    app.getHttpAdapter().getInstance().addHook('onSend', (request, reply, _payload, done) => { void reply.header('x-request-id', request.id); done(); });
    console.log('[Bootstrap] Setting up filters and prefix...');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready'] });
    app.enableShutdownHooks();
    if (config.swaggerEnabled) {
      console.log('[Bootstrap] Setting up Swagger...');
      SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Buzzerhood API').setVersion('1.0').addBearerAuth().build()));
    }
    console.log('[Bootstrap] Starting server on ' + config.host + ':' + config.port + '...');
    await app.listen({ host: config.host, port: config.port });
    console.log('[Bootstrap] Server is listening on ' + config.host + ':' + config.port);
  } catch (error) {
    console.error('[Bootstrap] ERROR during startup:');
    console.error(error);
    throw error;
  }
}

bootstrap().catch((error: unknown) => { 
  console.error('[Main] Backend startup failed:'); 
  console.error(error); 
  if (error instanceof Error && error.stack) {
    console.error('[Main] Stack trace:');
    console.error(error.stack);
  }
  process.exit(1); 
});
