export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function apiErrorMessage(error: unknown, fallback = 'Permintaan tidak dapat diproses.') {
  return error instanceof ApiClientError ? error.message : fallback;
}
