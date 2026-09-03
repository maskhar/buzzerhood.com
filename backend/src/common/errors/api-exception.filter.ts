import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorBody } from './api-error.js';

@Catch()
export class ApiExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const requestId = request.id;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const body = this.normalizeHttpError(status, response, requestId);
      void reply.status(status).send(body);
      return;
    }

    this.logger.error({ requestId, errorType: exception instanceof Error ? exception.name : 'unknown' }, 'Unhandled request error');
    void reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.', requestId }
    } satisfies ApiErrorBody);
  }

  private normalizeHttpError(status: number, response: string | object, requestId: string): ApiErrorBody {
    if (typeof response === 'object' && response !== null && 'error' in response) {
      const error = (response as ApiErrorBody).error;
      return { error: { ...error, requestId } };
    }
    return {
      error: {
        code: status === 404 ? 'NOT_FOUND' : 'REQUEST_FAILED',
        message: typeof response === 'string' ? response : 'Permintaan tidak dapat diproses.',
        requestId
      }
    };
  }
}
