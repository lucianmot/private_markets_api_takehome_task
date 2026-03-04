import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

vi.mock("../../../src/services/investment.service.js", () => ({
  getInvestmentsByFundId: vi.fn().mockResolvedValue([]),
  createInvestment: vi.fn().mockResolvedValue({
    id: "abc",
    fund_id: "fund-1",
    investor_id: "inv-1",
    amount_usd: 500000,
    investment_date: "2024-06-15",
  }),
}));

import * as investmentService from "../../../src/services/investment.service.js";
import { investmentRoutes } from "../../../src/routes/investments.js";

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(investmentRoutes);
  await app.ready();
  return app;
}

describe("investment routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /funds/:fund_id/investments → 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000/investments",
    });
    expect(res.statusCode).toBe(200);
    expect(investmentService.getInvestmentsByFundId).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("POST /funds/:fund_id/investments → 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000/investments",
      payload: {
        investor_id: "550e8400-e29b-41d4-a716-446655440001",
        amount_usd: 500000,
        investment_date: "2024-06-15",
      },
    });
    expect(res.statusCode).toBe(201);
    expect(investmentService.createInvestment).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      {
        investor_id: "550e8400-e29b-41d4-a716-446655440001",
        amount_usd: 500000,
        investment_date: "2024-06-15",
      },
    );
  });
});
