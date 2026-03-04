import { prisma } from "../lib/prisma.js";

export function findAll() {
  return prisma.transaction.findMany({ orderBy: { created_at: "desc" } });
}

export function findById(transactionId: string) {
  return prisma.transaction.findUnique({
    where: { transaction_id: transactionId },
  });
}

export function create(data: {
  fund_id: string;
  amount: number;
  fee_percentage: number;
  calculated_fees: number | null;
  auto_calculate_fees: boolean;
  bypass_validation: boolean;
  status: "pending" | "completed";
}) {
  return prisma.transaction.create({ data });
}

export function update(
  transactionId: string,
  data: {
    status?: "pending" | "completed" | "reversed";
    reason?: string;
    reversed_at?: Date;
    calculated_fees?: number | null;
    fee_percentage?: number;
  },
) {
  return prisma.transaction.update({
    where: { transaction_id: transactionId },
    data,
  });
}

export function findByFundIdAndStatus(fundId: string, status: string) {
  return prisma.transaction.findMany({
    where: {
      fund_id: fundId,
      status: status as "pending" | "completed" | "reversed",
    },
  });
}

export async function sumAmountByFundIdAndStatus(
  fundId: string,
  status: string,
) {
  const result = await prisma.transaction.aggregate({
    where: {
      fund_id: fundId,
      status: status as "pending" | "completed" | "reversed",
    },
    _sum: { amount: true },
    _count: true,
  });
  return { sum: result._sum.amount, count: result._count };
}

export function updateManyFeesByFundId(
  updates: Array<{
    transaction_id: string;
    fee_percentage: number;
    calculated_fees: number;
  }>,
) {
  return prisma.$transaction(
    updates.map((u) =>
      prisma.transaction.update({
        where: { transaction_id: u.transaction_id },
        data: {
          fee_percentage: u.fee_percentage,
          calculated_fees: u.calculated_fees,
        },
      }),
    ),
  );
}
