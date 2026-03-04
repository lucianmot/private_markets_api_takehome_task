import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

vi.mock("../../../src/services/transaction.service.js", () => ({
  recalculateFees: vi.fn().mockResolvedValue({
    updated_count: 1,
    new_fee_percentage: 3,
    transactions: [],
  }),
}));

import * as txnService from "../../../src/services/transaction.service.js";
import { adminRoutes } from "../../../src/routes/admin.js";

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(adminRoutes);
  await app.ready();
  return app;
}

describe("admin routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /admin/recalculate-fees → 200", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: "550e8400-e29b-41d4-a716-446655440000",
        new_fee_percentage: 3,
        apply_retroactively: true,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(txnService.recalculateFees).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      3,
      true,
    );
  });
});
