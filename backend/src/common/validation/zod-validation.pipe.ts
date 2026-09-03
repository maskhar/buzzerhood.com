import { HttpStatus, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ApiError } from '../errors/api-error.js';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_FAILED', 'Data tidak valid.',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), issue: issue.code })));
  }
}
