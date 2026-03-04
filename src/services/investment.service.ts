import * as investmentRepo from "../repositories/investment.repository.js";
import { getFundById } from "./fund.service.js";
import type { CreateInvestmentInput } from "../schemas/investment.schema.js";

function serialize(investment: {
  amount_usd: unknown;
  investment_date: Date;
  [key: string]: unknown;
}) {
  return {
    ...investment,
    amount_usd: Number(investment.amount_usd),
    investment_date: investment.investment_date.toISOString().split("T")[0],
  };
}

export async function getInvestmentsByFundId(fundId: string) {
  await getFundById(fundId);
  const investments = await investmentRepo.findByFundId(fundId);
  return investments.map(serialize);
}

export async function createInvestment(
  fundId: string,
  data: CreateInvestmentInput,
) {
  await getFundById(fundId);
  const investment = await investmentRepo.create(fundId, data);
  return serialize(investment);
}
