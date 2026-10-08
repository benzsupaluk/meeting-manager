import type { z } from 'zod';
import { ValidationError } from '../../domain/errors.js';

/** Parses `data` with `schema`, throwing a 400 ValidationError with field details on failure. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw new ValidationError('Invalid request', details);
  }
  return result.data;
}
