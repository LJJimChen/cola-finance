import { MiddlewareHandler } from 'hono';
import { z } from 'zod';

// Generic validation middleware
export const validate = <T extends z.ZodSchema<any>>(
  schema: T,
  extractData: (c: any) => any = (c) => c.req.valid()
): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const data = extractData(c);
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
            details: error.errors 
          }, 
          400
        );
      }
      
      return c.json(
        { 
          success: false, 
          error: 'Invalid input' 
        }, 
        400
      );
    }
  };
};