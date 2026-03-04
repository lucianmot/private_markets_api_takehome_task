import * as investorRepo from "../repositories/investor.repository.js";
import type { CreateInvestorInput } from "../schemas/investor.schema.js";

export async function getAllInvestors() {
  return investorRepo.findAll();
}

export async function createInvestor(data: CreateInvestorInput) {
  return investorRepo.create(data);
}
