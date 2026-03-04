vi.mock("../../src/services/fund.service.js", () => ({
  getAllFunds: vi.fn().mockResolvedValue([]),
  getFundById: vi.fn().mockResolvedValue({}),
  createFund: vi.fn().mockResolvedValue({}),
  updateFund: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../src/services/investor.service.js", () => ({
  getAllInvestors: vi.fn().mockResolvedValue([]),
  createInvestor: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../src/services/investment.service.js", () => ({
  getInvestmentsByFundId: vi.fn().mockResolvedValue([]),
  createInvestment: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../src/services/transaction.service.js", () => ({
  getAllTransactions: vi.fn().mockResolvedValue([]),
  processTransaction: vi.fn().mockResolvedValue({}),
  reverseTransaction: vi.fn().mockResolvedValue({}),
  getFundTotalValue: vi.fn().mockResolvedValue({}),
  recalculateFees: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../src/lib/prisma.js", () => ({ prisma: {} }));

import { buildApp } from "../../src/app.js";

describe("buildApp", () => {
  it("returns a Fastify instance", async () => {
    const app = await buildApp();
    expect(typeof app.inject).toBe("function");
    await app.close();
  });

  it("registers health route", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    await app.close();
  });
});
