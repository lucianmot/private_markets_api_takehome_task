import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

vi.mock("../../../src/services/investor.service.js", () => ({
  getAllInvestors: vi.fn().mockResolvedValue([]),
  createInvestor: vi.fn().mockResolvedValue({
    id: "abc",
    name: "Investor",
    investor_type: "Individual",
    email: "test@example.com",
  }),
}));

import * as investorService from "../../../src/services/investor.service.js";
import { investorRoutes } from "../../../src/routes/investors.js";

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(investorRoutes);
  await app.ready();
  return app;
}

describe("investor routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /investors → 200", async () => {
    const res = await app.inject({ method: "GET", url: "/investors" });
    expect(res.statusCode).toBe(200);
    expect(investorService.getAllInvestors).toHaveBeenCalled();
  });

  it("POST /investors → 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: {
        name: "New Investor",
        investor_type: "Institution",
        email: "new@example.com",
      },
    });
    expect(res.statusCode).toBe(201);
    expect(investorService.createInvestor).toHaveBeenCalled();
  });
});
