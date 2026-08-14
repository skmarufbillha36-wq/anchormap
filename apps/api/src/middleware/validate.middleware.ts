import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/errors';

type Target = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validate(mySchema), controller.create)
 * Usage: router.get('/', validate(mySchema, 'query'), controller.list)
 *
 * On failure, throws ApiError(400) with field-level error messages.
 */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      throw new ApiError(400, 'Validation failed.', errors);
    }

    // Replace the target with the parsed (and coerced) data
    if (target === 'query') {
      // Express 5: req.query may be a read-only getter — use defineProperty
      try {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        // Fallback: app.ts compat patch already made it writable — try direct assign
        (req as any).query = result.data;
      }
    } else {
      req[target] = result.data;
    }
    next();

  };
}

/**
 * Formats a ZodError into the ApiResponse errors format:
 * { field: ["Error message 1", "Error message 2"] }
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'root';
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(issue.message);
  }

  return errors;
}
