import { prisma } from "../lib/prisma.js";
import type { CreateInvestorInput } from "../schemas/investor.schema.js";

export function findAll() {
  return prisma.investor.findMany({ orderBy: { created_at: "desc" } });
}

export function create(data: CreateInvestorInput) {
  return prisma.investor.create({ data });
}
