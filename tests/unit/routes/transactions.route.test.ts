import Fastify from "fastify";
import { validatorCompiler } from "fastify-type-provider-zod";

vi.mock("../../../src/services/transaction.service.js", () => ({
  getAllTransactions: vi.fn().mockResolvedValue([]),
  processTransaction: vi.fn().mockResolvedValue({
    transaction_id: "550e8400-e29b-41d4-a716-446655440000",
    fund_id: "550e8400-e29b-41d4-a716-446655440001",
    amount: 100000,
    fee_percentage: 2.5,
    calculated_fees: 2500,
    auto_calculate_fees: true,
    bypass_validation: false,
    status: "completed",
    created_at: new Date("2024-01-01"),
    reason: null,
    reversed_at: null,
  }),
  reverseTransaction: vi.fn().mockResolvedValue({
    transaction_id: "550e8400-e29b-41d4-a716-446655440000",
    fund_id: "550e8400-e29b-41d4-a716-446655440001",
    amount: 100000,
    fee_percentage: 2.5,
    calculated_fees: null,
    auto_calculate_fees: true,
    bypass_validation: false,
    status: "reversed",
    created_at: new Date("2024-01-01"),
    reason: "test",
    reversed_at: new Date("2024-01-02"),
  }),
}));

import * as txnService from "../../../src/services/transaction.service.js";
import { transactionRoutes } from "../../../src/routes/transactions.js";

const TXN_ID = "550e8400-e29b-41d4-a716-446655440000";
const FUND_ID = "550e8400-e29b-41d4-a716-446655440001";

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(() => (data) => JSON.stringify(data));
  await app.register(transactionRoutes);
  await app.ready();
  return app;
}

describe("transaction routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /transactions → 200", async () => {
    const res = await app.inject({ method: "GET", url: "/transactions" });
    expect(res.statusCode).toBe(200);
    expect(txnService.getAllTransactions).toHaveBeenCalled();
  });

  it("POST /transactions/process → 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/transactions/process",
      payload: {
        fund_id: FUND_ID,
        amount: 100000,
        fee_percentage: 2.5,
        auto_calculate_fees: true,
        bypass_validation: false,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(txnService.processTransaction).toHaveBeenCalled();
  });

  it("PUT /transactions/:transaction_id/reverse → 200", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/transactions/${TXN_ID}/reverse`,
      payload: { reason: "test reversal", refund_fees: true },
    });
    expect(res.statusCode).toBe(200);
    expect(txnService.reverseTransaction).toHaveBeenCalledWith(
      TXN_ID,
      "test reversal",
      true,
    );
  });
});
