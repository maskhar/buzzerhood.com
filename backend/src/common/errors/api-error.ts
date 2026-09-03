import { HttpException, type HttpStatus } from '@nestjs/common';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export class ApiError extends HttpException {
  constructor(status: HttpStatus, code: string, message: string, details?: unknown) {
    const error: ApiErrorBody['error'] = { code, message };
    if (details !== undefined) error.details = details;
    super({ error }, status);
  }
}
