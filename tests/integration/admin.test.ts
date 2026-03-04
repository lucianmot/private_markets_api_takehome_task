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

async function processTransaction(fundId: string) {
  const res = await app.inject({
    method: "POST",
    url: "/transactions/process",
    payload: {
      fund_id: fundId,
      amount: 100000,
      fee_percentage: 2.5,
      auto_calculate_fees: true,
      bypass_validation: false,
    },
  });
  return res.json();
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

describe("POST /admin/recalculate-fees", () => {
  it("recalculates fees retroactively", async () => {
    const fund = await createFund();
    await processTransaction(fund.id);

    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: fund.id,
        new_fee_percentage: 5,
        apply_retroactively: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.updated_count).toBe(1);
    expect(body.new_fee_percentage).toBe(5);
    expect(body.transactions[0].calculated_fees).toBe(5000);
  });

  it("returns zero updates when not retroactive", async () => {
    const fund = await createFund();
    await processTransaction(fund.id);

    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: fund.id,
        new_fee_percentage: 5,
        apply_retroactively: false,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().updated_count).toBe(0);
    expect(res.json().transactions).toEqual([]);
  });

  it("returns 404 for non-existent fund", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: "550e8400-e29b-41d4-a716-446655440000",
        new_fee_percentage: 5,
        apply_retroactively: true,
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it("handles no transactions gracefully", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: fund.id,
        new_fee_percentage: 5,
        apply_retroactively: true,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().updated_count).toBe(0);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for negative fee percentage", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: fund.id,
        new_fee_percentage: -1,
        apply_retroactively: true,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("recalculates multiple transactions", async () => {
    const fund = await createFund();
    await processTransaction(fund.id);
    await processTransaction(fund.id);

    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: fund.id,
        new_fee_percentage: 1,
        apply_retroactively: true,
      },
    });

    expect(res.json().updated_count).toBe(2);
    expect(res.json().transactions).toHaveLength(2);
    for (const txn of res.json().transactions) {
      expect(txn.calculated_fees).toBe(1000);
    }
  });

  it("does not affect reversed transactions", async () => {
    const fund = await createFund();
    const txn = await processTransaction(fund.id);

    await app.inject({
      method: "PUT",
      url: `/transactions/${txn.transaction_id}/reverse`,
      payload: { reason: "test", refund_fees: false },
    });

    const res = await app.inject({
      method: "POST",
      url: "/admin/recalculate-fees",
      payload: {
        fund_id: fund.id,
        new_fee_percentage: 10,
        apply_retroactively: true,
      },
    });

    expect(res.json().updated_count).toBe(0);
  });
});
