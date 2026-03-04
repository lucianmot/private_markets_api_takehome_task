import type { FastifyInstance } from "fastify";
import { createTestApp } from "../helpers/app.js";
import { cleanDatabase } from "../helpers/db.js";
import {
  validCreateFund,
  validCreateInvestor,
  validCreateInvestment,
} from "../helpers/fixtures.js";

let app: FastifyInstance;

async function createFund() {
  const res = await app.inject({
    method: "POST",
    url: "/funds",
    payload: validCreateFund,
  });
  return res.json();
}

async function createInvestor(email = "investor@example.com") {
  const res = await app.inject({
    method: "POST",
    url: "/investors",
    payload: { ...validCreateInvestor, email },
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

describe("GET /funds/:fund_id/investments", () => {
  it("returns empty array when no investments exist", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/investments`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("returns investments for a fund", async () => {
    const fund = await createFund();
    const investor = await createInvestor();

    await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: { ...validCreateInvestment, investor_id: investor.id },
    });

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund.id}/investments`,
    });

    expect(res.statusCode).toBe(200);
    const investments = res.json();
    expect(investments).toHaveLength(1);
    expect(investments[0].fund_id).toBe(fund.id);
  });

  it("returns 404 for non-existent fund", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000/investments",
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for invalid fund_id UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/not-a-uuid/investments",
    });

    expect(res.statusCode).toBe(400);
  });

  it("does not return investments from other funds", async () => {
    const fund1 = await createFund();
    const fund2 = await createFund();
    const investor = await createInvestor();

    await app.inject({
      method: "POST",
      url: `/funds/${fund1.id}/investments`,
      payload: { ...validCreateInvestment, investor_id: investor.id },
    });

    const res = await app.inject({
      method: "GET",
      url: `/funds/${fund2.id}/investments`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});

describe("POST /funds/:fund_id/investments", () => {
  it("creates an investment and returns 201", async () => {
    const fund = await createFund();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: { ...validCreateInvestment, investor_id: investor.id },
    });

    expect(res.statusCode).toBe(201);
    const investment = res.json();
    expect(investment.fund_id).toBe(fund.id);
    expect(investment.investor_id).toBe(investor.id);
    expect(investment).toHaveProperty("id");
  });

  it("returns amount_usd as a number", async () => {
    const fund = await createFund();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: { ...validCreateInvestment, investor_id: investor.id },
    });

    expect(typeof res.json().amount_usd).toBe("number");
  });

  it("returns investment_date as YYYY-MM-DD string", async () => {
    const fund = await createFund();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: { ...validCreateInvestment, investor_id: investor.id },
    });

    expect(res.json().investment_date).toBe("2024-06-15");
    expect(typeof res.json().investment_date).toBe("string");
  });

  it("returns 404 for non-existent fund", async () => {
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000/investments",
      payload: { ...validCreateInvestment, investor_id: investor.id },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for non-existent investor (FK violation)", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: {
        ...validCreateInvestment,
        investor_id: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const fund = await createFund();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: {
        ...validCreateInvestment,
        investor_id: investor.id,
        investment_date: "15/06/2024",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const fund = await createFund();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for negative amount", async () => {
    const fund = await createFund();
    const investor = await createInvestor();

    const res = await app.inject({
      method: "POST",
      url: `/funds/${fund.id}/investments`,
      payload: {
        ...validCreateInvestment,
        investor_id: investor.id,
        amount_usd: -100,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid fund_id UUID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds/not-a-uuid/investments",
      payload: validCreateInvestment,
    });

    expect(res.statusCode).toBe(400);
  });
});
