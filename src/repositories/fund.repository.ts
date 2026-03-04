import { prisma } from "../lib/prisma.js";
import type {
  CreateFundInput,
  UpdateFundInput,
} from "../schemas/fund.schema.js";

export function findAll() {
  return prisma.fund.findMany({ orderBy: { created_at: "desc" } });
}

export function findById(id: string) {
  return prisma.fund.findUnique({ where: { id } });
}

export function create(data: CreateFundInput) {
  return prisma.fund.create({ data });
}

export function update(id: string, data: UpdateFundInput) {
  return prisma.fund.update({ where: { id }, data });
}
