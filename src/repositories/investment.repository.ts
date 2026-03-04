import { prisma } from "../lib/prisma.js";
import type { CreateInvestmentInput } from "../schemas/investment.schema.js";

export function findByFundId(fundId: string) {
  return prisma.investment.findMany({
    where: { fund_id: fundId },
    orderBy: { investment_date: "desc" },
  });
}

export function create(fundId: string, data: CreateInvestmentInput) {
  return prisma.investment.create({
    data: {
      fund_id: fundId,
      investor_id: data.investor_id,
      amount_usd: data.amount_usd,
      investment_date: new Date(data.investment_date),
    },
  });
}
