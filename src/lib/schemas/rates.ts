import { z } from 'astro/zod';

export const depositRateItemSchema = z.object({
  term: z.string(),
  rate: z.number().nullable(),
  note: z.string().nullable().optional(),
});

export const loanRateItemSchema = z.object({
  purpose: z.string(),
  rate: z.number().nullable(),
  term: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const ratesSchema = z.object({
  effective_from: z.string().nullable(),
  deposit_rates: z.array(depositRateItemSchema),
  loan_rates: z.array(loanRateItemSchema),
});

export type DepositRateItem = z.infer<typeof depositRateItemSchema>;
export type LoanRateItem = z.infer<typeof loanRateItemSchema>;
export type RatesData = z.infer<typeof ratesSchema>;
