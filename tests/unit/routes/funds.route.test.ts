import Fastify from "fastify";
import { validatorCompiler } from "fastify-type-provider-zod";

vi.mock("../../../src/services/fund.service.js", () => ({
  getAllFunds: vi.fn().mockResolvedValue([]),
  getFundById: vi.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Fund",
    vintage_year: 2024,
    target_size_usd: 1000000,
    status: "Fundraising",
    created_at: new Date("2024-01-01"),
  }),
  createFund: vi.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "New",
    vintage_year: 2024,
    target_size_usd: 1000000,
    status: "Fundraising",
    created_at: new Date("2024-01-01"),
  }),
  updateFund: vi.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Updated",
    vintage_year: 2024,
    target_size_usd: 1000000,
    status: "Fundraising",
    created_at: new Date("2024-01-01"),
  }),
}));

vi.mock("../../../src/services/transaction.service.js", () => ({
  getFundTotalValue: vi.fn().mockResolvedValue({
    fund_id: "550e8400-e29b-41d4-a716-446655440000",
    total_value: 500000,
    completed_count: 2,
  }),
}));

import * as fundService from "../../../src/services/fund.service.js";
import * as txnService from "../../../src/services/transaction.service.js";
import { fundRoutes } from "../../../src/routes/funds.js";

const FUND_ID = "550e8400-e29b-41d4-a716-446655440000";

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(() => (data) => JSON.stringify(data));
  await app.register(fundRoutes);
  await app.ready();
  return app;
}

describe("fund routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /funds → 200", async () => {
    const res = await app.inject({ method: "GET", url: "/funds" });
    expect(res.statusCode).toBe(200);
    expect(fundService.getAllFunds).toHaveBeenCalled();
  });

  it("POST /funds → 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      payload: {
        name: "New Fund",
        vintage_year: 2024,
        target_size_usd: 1000000,
        status: "Fundraising",
      },
    });
    expect(res.statusCode).toBe(201);
    expect(fundService.createFund).toHaveBeenCalled();
  });

  it("GET /funds/:id → 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/funds/${FUND_ID}`,
    });
    expect(res.statusCode).toBe(200);
    expect(fundService.getFundById).toHaveBeenCalledWith(FUND_ID);
  });

  it("PUT /funds/:id → 200", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/funds/${FUND_ID}`,
      payload: { name: "Updated" },
    });
    expect(res.statusCode).toBe(200);
    expect(fundService.updateFund).toHaveBeenCalledWith(FUND_ID, {
      name: "Updated",
    });
  });

  it("GET /funds/:fund_id/total-value → 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/funds/${FUND_ID}/total-value?include_pending=true`,
    });
    expect(res.statusCode).toBe(200);
    expect(txnService.getFundTotalValue).toHaveBeenCalledWith(FUND_ID, true);
  });
});
