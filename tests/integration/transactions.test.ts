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

async function processTransaction(fundId: string, overrides = {}) {
  const res = await app.inject({
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
  return res;
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

describe("GET /transactions", () => {
  it("returns empty array when no transactions exist", async () => {
    const res = await app.inject({ method: "GET", url: "/transactions" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("returns list of transactions", async () => {
    const fund = await createFund();
    await processTransaction(fund.id);

    const res = await app.inject({ method: "GET", url: "/transactions" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });
});

describe("POST /transactions/process", () => {
  it("creates a transaction and returns 201", async () => {
    const fund = await createFund();
    const res = await processTransaction(fund.id);

    expect(res.statusCode).toBe(201);
    const txn = res.json();
    expect(txn.fund_id).toBe(fund.id);
    expect(txn.status).toBe("completed");
    expect(txn).toHaveProperty("transaction_id");
  });

  it("auto-calculates fees", async () => {
    const fund = await createFund();
    const res = await processTransaction(fund.id, {
      amount: 100000,
      fee_percentage: 2.5,
      auto_calculate_fees: true,
      bypass_validation: false,
    });

    expect(res.json().calculated_fees).toBe(2500);
  });

  it("returns null fees when auto_calculate is false", async () => {
    const fund = await createFund();
    const res = await processTransaction(fund.id, {
      auto_calculate_fees: false,
    });

    expect(res.json().calculated_fees).toBeNull();
  });

  it("returns null fees when bypass_validation is true", async () => {
    const fund = await createFund();
    const res = await processTransaction(fund.id, {
      bypass_validation: true,
    });

    expect(res.json().calculated_fees).toBeNull();
  });

  it("returns amount as number", async () => {
    const fund = await createFund();
    const res = await processTransaction(fund.id);

    expect(typeof res.json().amount).toBe("number");
    expect(typeof res.json().fee_percentage).toBe("number");
  });

  it("returns 404 for non-existent fund", async () => {
    const res = await processTransaction(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/transactions/process",
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for negative amount", async () => {
    const fund = await createFund();
    const res = await processTransaction(fund.id, { amount: -100 });

    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /transactions/:transaction_id/reverse", () => {
  it("reverses a transaction", async () => {
    const fund = await createFund();
    const created = await processTransaction(fund.id);
    const txnId = created.json().transaction_id;

    const res = await app.inject({
      method: "PUT",
      url: `/transactions/${txnId}/reverse`,
      payload: { reason: "Client request", refund_fees: false },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("reversed");
    expect(res.json().reason).toBe("Client request");
  });

  it("returns 409 when already reversed", async () => {
    const fund = await createFund();
    const created = await processTransaction(fund.id);
    const txnId = created.json().transaction_id;

    await app.inject({
      method: "PUT",
      url: `/transactions/${txnId}/reverse`,
      payload: { reason: "first", refund_fees: false },
    });

    const res = await app.inject({
      method: "PUT",
      url: `/transactions/${txnId}/reverse`,
      payload: { reason: "second", refund_fees: false },
    });

    expect(res.statusCode).toBe(409);
  });

  it("nullifies fees when refund_fees is true", async () => {
    const fund = await createFund();
    const created = await processTransaction(fund.id);
    const txnId = created.json().transaction_id;

    const res = await app.inject({
      method: "PUT",
      url: `/transactions/${txnId}/reverse`,
      payload: { reason: "refund", refund_fees: true },
    });

    expect(res.json().calculated_fees).toBeNull();
  });

  it("returns 404 for non-existent transaction", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/transactions/550e8400-e29b-41d4-a716-446655440000/reverse",
      payload: { reason: "test", refund_fees: false },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for missing reason", async () => {
    const fund = await createFund();
    const created = await processTransaction(fund.id);
    const txnId = created.json().transaction_id;

    const res = await app.inject({
      method: "PUT",
      url: `/transactions/${txnId}/reverse`,
      payload: { refund_fees: false },
    });

    expect(res.statusCode).toBe(400);
  });
});
