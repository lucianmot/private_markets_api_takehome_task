import type { FastifyInstance } from "fastify";
import { createTestApp } from "../helpers/app.js";
import { cleanDatabase } from "../helpers/db.js";
import { validCreateFund } from "../helpers/fixtures.js";

let app: FastifyInstance;

async function createFund() {
  const res = await app.inject({
    method: "POST",
    url: "/funds",
    payload: validCreateFund,
  });
  return res.json();
}

async function processTransaction(
  fundId: string,
  overrides: Record<string, unknown> = {},
) {
  await app.inject({
    method: "POST",
    url: "/transactions/process",
    payload: {
      fund_id: fundId,
      amount: 100000,
      fee_percentage: 2.5,
      auto_calculate_fees: true,
      bypass_validation: false,
      ...overrides,
    },
  });
}

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await cleanDatabase();
});

describe("GET /funds/:fund_id/total-value", () => {
  it("returns zero when no transactions", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/total-value`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.fund_id).toBe(fund.id);
    expect(body.total_value).toBe(0);
    expect(body.completed_count).toBe(0);
  });

  it("sums completed transactions", async () => {
    const fund = await createFund();
    await processTransaction(fund.id, { amount: 100000 });
    await processTransaction(fund.id, { amount: 200000 });

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/total-value`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().total_value).toBe(300000);
    expect(res.json().completed_count).toBe(2);
  });

  it("excludes pending by default", async () => {
    const fund = await createFund();
    await processTransaction(fund.id, { amount: 100000 });

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/total-value`,
    });

    const body = res.json();
    expect(body.pending_count).toBeUndefined();
    expect(body.pending_value).toBeUndefined();
  });

  it("includes pending when requested", async () => {
    const fund = await createFund();
    await processTransaction(fund.id, { amount: 100000 });

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/total-value?include_pending=true`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("pending_count");
    expect(body).toHaveProperty("pending_value");
  });

  it("does not count reversed transactions", async () => {
    const fund = await createFund();
    await processTransaction(fund.id, { amount: 100000 });

    const txnRes = await app.inject({
      method: "POST",
      url: "/transactions/process",
      payload: {
        fund_id: fund.id,
        amount: 50000,
        fee_percentage: 2.5,
        auto_calculate_fees: true,
        bypass_validation: false,
      },
    });
    const txnId = txnRes.json().transaction_id;

    await app.inject({
      method: "PUT",
      url: `/transactions/${txnId}/reverse`,
      payload: { reason: "test", refund_fees: false },
    });

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/total-value`,
    });

    expect(res.json().total_value).toBe(100000);
    expect(res.json().completed_count).toBe(1);
  });

  it("returns 404 for non-existent fund", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000/total-value",
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for invalid fund_id UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/not-a-uuid/total-value",
    });

    expect(res.statusCode).toBe(400);
  });

  it("handles include_pending=false", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/total-value?include_pending=false`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().pending_count).toBeUndefined();
  });
});
