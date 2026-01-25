import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ExchangeRateService } from '../services/exchange-rate-service';

const querySchema = z.object({
  baseCurrency: z.string().min(3).max(8).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const exchangeRateRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
  };
}>();

exchangeRateRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const q = c.req.valid('query');
  const date = q.date ?? new Date().toISOString().slice(0, 10);
  const baseCurrency = q.baseCurrency;

  const db = c.get('db');
  const exchangeRateService = new ExchangeRateService(db);
  const rates = await exchangeRateService.getRates(date, baseCurrency);

  return c.json(rates);
});

