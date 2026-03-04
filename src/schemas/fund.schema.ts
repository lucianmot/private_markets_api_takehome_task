import { z } from "zod";

export const CreateFundSchema = z.object({
  name: z.string().min(1),
  vintage_year: z.number().int().min(1900).max(2100),
  target_size_usd: z.number().positive(),
  status: z.enum(["Fundraising", "Investing", "Closed"]),
});

export const UpdateFundSchema = CreateFundSchema.partial();

export const FundParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateFundInput = z.infer<typeof CreateFundSchema>;
export type UpdateFundInput = z.infer<typeof UpdateFundSchema>;
export type FundParams = z.infer<typeof FundParamsSchema>;
