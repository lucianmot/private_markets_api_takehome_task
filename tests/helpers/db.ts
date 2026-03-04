import { prisma } from "../../src/lib/prisma.js";

export async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.fund.deleteMany();
}
