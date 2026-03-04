import * as fundRepo from "../repositories/fund.repository.js";
import { NotFoundError } from "../lib/errors.js";
import type {
  CreateFundInput,
  UpdateFundInput,
} from "../schemas/fund.schema.js";

function serialize(fund: { target_size_usd: unknown; [key: string]: unknown }) {
  return { ...fund, target_size_usd: Number(fund.target_size_usd) };
}

export async function getAllFunds() {
  const funds = await fundRepo.findAll();
  return funds.map(serialize);
}

export async function getFundById(id: string) {
  const fund = await fundRepo.findById(id);
  if (!fund) throw new NotFoundError("Fund", id);
  return serialize(fund);
}

export async function createFund(data: CreateFundInput) {
  const fund = await fundRepo.create(data);
  return serialize(fund);
}

export async function updateFund(id: string, data: UpdateFundInput) {
  const fund = await fundRepo.update(id, data);
  return serialize(fund);
}
