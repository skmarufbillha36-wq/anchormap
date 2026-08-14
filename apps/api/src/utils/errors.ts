import { Request, Response, NextFunction } from 'express';

/**
 * Standard API error — thrown anywhere in the request lifecycle.
 * Caught by the global errorMiddleware and formatted into ApiResponse.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Builds consistent API response objects.
 */
export const ApiResponseBuilder = {
  success<T>(message: string, data?: T, pagination?: object) {
    return {
      success: true,
      message,
      ...(data !== undefined && { data }),
      ...(pagination && { pagination }),
    };
  },

  error(message: string, errors?: Record<string, string[]>) {
    return {
      success: false,
      message,
      ...(errors && { errors }),
    };
  },
};

/**
 * Global error handler middleware — must be registered LAST in the app.
 * Catches all errors thrown in routes, controllers, services, and repositories.
 * Express 5 automatically passes rejected async promises here.
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Known operational error
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(ApiResponseBuilder.error(err.message, err.errors));
    return;
  }

  // Prisma unique constraint violation
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] ?? 'field';
      res.status(409).json(ApiResponseBuilder.error(`A record with this ${field} already exists.`));
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json(ApiResponseBuilder.error('Record not found.'));
      return;
    }
  }

  // Unexpected error — log details, hide from client in production
  console.error('[ERROR]', err);

  res.status(500).json(
    ApiResponseBuilder.error(
      process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
    )
  );
}
