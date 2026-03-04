vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({
        _sum: { amount: "100000" },
        _count: 5,
      }),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

import { prisma } from "../../../src/lib/prisma.js";
import {
  findAll,
  findById,
  create,
  update,
  findByFundIdAndStatus,
  sumAmountByFundIdAndStatus,
  updateManyFeesByFundId,
} from "../../../src/repositories/transaction.repository.js";

describe("transaction.repository", () => {
  it("findAll calls findMany with orderBy", async () => {
    await findAll();
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
    });
  });

  it("findById calls findUnique with transaction_id", async () => {
    await findById("txn-1");
    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
      where: { transaction_id: "txn-1" },
    });
  });

  it("create calls create with data", async () => {
    const data = {
      fund_id: "fund-1",
      amount: 100000,
      fee_percentage: 2.5,
      calculated_fees: 2500,
      auto_calculate_fees: true,
      bypass_validation: false,
      status: "completed" as const,
    };
    await create(data);
    expect(prisma.transaction.create).toHaveBeenCalledWith({ data });
  });

  it("update calls update with transaction_id and data", async () => {
    await update("txn-1", { status: "reversed", reason: "test" });
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { transaction_id: "txn-1" },
      data: { status: "reversed", reason: "test" },
    });
  });

  it("findByFundIdAndStatus calls findMany with where clause", async () => {
    await findByFundIdAndStatus("fund-1", "completed");
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: { fund_id: "fund-1", status: "completed" },
    });
  });

  it("sumAmountByFundIdAndStatus returns mapped sum and count", async () => {
    const result = await sumAmountByFundIdAndStatus("fund-1", "completed");
    expect(prisma.transaction.aggregate).toHaveBeenCalledWith({
      where: { fund_id: "fund-1", status: "completed" },
      _sum: { amount: true },
      _count: true,
    });
    expect(result).toEqual({ sum: "100000", count: 5 });
  });

  it("updateManyFeesByFundId calls $transaction with updates", async () => {
    const updates = [
      { transaction_id: "t1", fee_percentage: 3, calculated_fees: 3000 },
    ];
    await updateManyFeesByFundId(updates);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
