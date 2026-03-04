import { z } from "zod/v4";

export const CreateInvestorSchema = z.object({
  name: z.string().min(1),
  investor_type: z.enum(["Individual", "Institution", "FamilyOffice"]),
  email: z.email(),
});

export type CreateInvestorInput = z.infer<typeof CreateInvestorSchema>;
