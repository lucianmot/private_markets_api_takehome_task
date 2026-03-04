import { z } from "zod";

// Widened type prevents the Zod type-provider from enforcing response shapes
// on reply.send() while still generating correct OpenAPI documentation.
export function docResponse(
  schemas: Record<number, z.ZodTypeAny>,
): Record<number, z.ZodTypeAny> {
  return schemas;
}

// ── Error responses (reused across all routes) ──

export const ErrorResponseSchema = z.object({
  error: z.string(),
  statusCode: z.number(),
  message: z.string(),
});

export const ValidationErrorSchema = z.object({
  error: z.string(),
  statusCode: z.number(),
  details: z.array(z.object({ message: z.string() })),
});

// ── Entity response schemas ──

export const FundResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  vintage_year: z.number(),
  target_size_usd: z.number(),
  status: z.enum(["Fundraising", "Investing", "Closed"]),
  created_at: z.date(),
});

export const InvestorResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  investor_type: z.enum(["Individual", "Institution", "FamilyOffice"]),
  email: z.string(),
  created_at: z.date(),
});

export const InvestmentResponseSchema = z.object({
  id: z.string().uuid(),
  fund_id: z.string().uuid(),
  investor_id: z.string().uuid(),
  amount_usd: z.number(),
  investment_date: z.string(),
});

export const TransactionResponseSchema = z.object({
  transaction_id: z.string().uuid(),
  fund_id: z.string().uuid(),
  amount: z.number(),
  fee_percentage: z.number(),
  calculated_fees: z.number().nullable(),
  auto_calculate_fees: z.boolean(),
  bypass_validation: z.boolean(),
  status: z.enum(["pending", "completed", "reversed"]),
  created_at: z.date(),
  reason: z.string().nullable(),
  reversed_at: z.date().nullable(),
});

export const TotalValueResponseSchema = z.object({
  fund_id: z.string().uuid(),
  total_value: z.number(),
  completed_count: z.number(),
  pending_count: z.number().optional(),
  pending_value: z.number().optional(),
});

export const RecalculateFeesResponseSchema = z.object({
  updated_count: z.number(),
  new_fee_percentage: z.number(),
  transactions: z.array(TransactionResponseSchema),
});
