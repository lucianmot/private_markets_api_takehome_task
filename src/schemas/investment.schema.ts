import { z } from "zod";

export const InvestmentParamsSchema = z.object({
  fund_id: z.string().uuid(),
});

export const CreateInvestmentSchema = z.object({
  investor_id: z.string().uuid(),
  amount_usd: z.number().positive(),
  investment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type InvestmentParams = z.infer<typeof InvestmentParamsSchema>;
export type CreateInvestmentInput = z.infer<typeof CreateInvestmentSchema>;
