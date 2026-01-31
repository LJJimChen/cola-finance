export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'MISSING_EXCHANGE_RATE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(args: { status: number; code: ErrorCode; message: string; details?: Record<string, unknown> }) {
    super(args.message);
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
  }

  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super({ status: 404, code: 'NOT_FOUND', message, details });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super({ status: 409, code: 'CONFLICT', message, details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super({ status: 403, code: 'FORBIDDEN', message, details });
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation error', details?: Record<string, unknown>) {
    super({ status: 400, code: 'VALIDATION_ERROR', message, details });
  }
}

export class MissingExchangeRateError extends AppError {
  constructor(message: string = 'Missing exchange rate', details?: Record<string, unknown>) {
    super({ status: 422, code: 'MISSING_EXCHANGE_RATE', message, details });
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({ status: 500, code: 'INTERNAL_ERROR', message: error.message });
  }

  return new AppError({ status: 500, code: 'INTERNAL_ERROR', message: 'Unknown error' });
}
