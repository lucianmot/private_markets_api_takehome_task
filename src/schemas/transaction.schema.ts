import { z } from "zod";

export const ProcessTransactionSchema = z.object({
  fund_id: z.string().uuid(),
  amount: z.number().positive(),
  fee_percentage: z.number().min(0),
  auto_calculate_fees: z.boolean(),
  bypass_validation: z.boolean(),
});

export const ReverseTransactionSchema = z.object({
  reason: z.string().min(1),
  refund_fees: z.boolean(),
});

export const RecalculateFeesSchema = z.object({
  fund_id: z.string().uuid(),
  new_fee_percentage: z.number().min(0),
  apply_retroactively: z.boolean(),
});

export const TotalValueQuerySchema = z.object({
  include_pending: z.enum(["true", "false"]).optional(),
});

export const TransactionParamsSchema = z.object({
  transaction_id: z.string().uuid(),
});

export type ProcessTransactionInput = z.infer<typeof ProcessTransactionSchema>;
export type ReverseTransactionInput = z.infer<typeof ReverseTransactionSchema>;
export type RecalculateFeesInput = z.infer<typeof RecalculateFeesSchema>;
export type TotalValueQuery = z.infer<typeof TotalValueQuerySchema>;
export type TransactionParams = z.infer<typeof TransactionParamsSchema>;
