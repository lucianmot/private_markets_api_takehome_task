vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: {
    investment: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma.js";
import {
  findByFundId,
  create,
} from "../../../src/repositories/investment.repository.js";

describe("investment.repository", () => {
  it("findByFundId calls findMany with fund_id and orderBy", async () => {
    await findByFundId("fund-1");
    expect(prisma.investment.findMany).toHaveBeenCalledWith({
      where: { fund_id: "fund-1" },
      orderBy: { investment_date: "desc" },
    });
  });

  it("create converts date string to Date and passes correct data", async () => {
    const input = {
      investor_id: "inv-1",
      amount_usd: 500000,
      investment_date: "2024-06-15",
    };
    await create("fund-1", input);
    expect(prisma.investment.create).toHaveBeenCalledWith({
      data: {
        fund_id: "fund-1",
        investor_id: "inv-1",
        amount_usd: 500000,
        investment_date: new Date("2024-06-15"),
      },
    });
  });
});
