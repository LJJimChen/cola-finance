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

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({ status: 500, code: 'INTERNAL_ERROR', message: error.message });
  }

  return new AppError({ status: 500, code: 'INTERNAL_ERROR', message: 'Unknown error' });
}

