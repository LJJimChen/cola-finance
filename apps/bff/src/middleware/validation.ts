import type { Context, MiddlewareHandler } from 'hono';
import { z } from 'zod';

// Generic validation middleware
export const validate = <T extends z.ZodTypeAny>(
  schema: T,
  extractData: (c: Context) => unknown | Promise<unknown> = (c) => c.req.json(),
): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const data = await extractData(c);
      const parsed = await schema.parseAsync(data);
      
      // Attach validated data to context
      c.set('validatedData', parsed);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          { 
            success: false, 
            error: 'Validation Error', 
            details: error.issues,
          }, 
          400,
        );
      }
      
      return c.json(
        { 
          success: false, 
          error: 'Invalid input', 
        }, 
        400,
      );
    }
  };
};
