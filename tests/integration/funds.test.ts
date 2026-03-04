import type { FastifyInstance } from "fastify";
import { createTestApp } from "../helpers/app.js";
import { cleanDatabase } from "../helpers/db.js";
import { validCreateFund } from "../helpers/fixtures.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await cleanDatabase();
});

describe("GET /funds", () => {
  it("returns empty array when no funds exist", async () => {
    const res = await app.inject({ method: "GET", url: "/funds" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("returns list of funds", async () => {
    await app.inject({
      method: "POST",
      url: "/funds",
      payload: validCreateFund,
    });

    const res = await app.inject({ method: "GET", url: "/funds" });

    expect(res.statusCode).toBe(200);
    const funds = res.json();
    expect(funds).toHaveLength(1);
    expect(funds[0].name).toBe(validCreateFund.name);
  });
});

describe("POST /funds", () => {
  it("creates a fund and returns 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      payload: validCreateFund,
    });

    expect(res.statusCode).toBe(201);
    const fund = res.json();
    expect(fund.name).toBe(validCreateFund.name);
    expect(fund.vintage_year).toBe(validCreateFund.vintage_year);
    expect(fund.target_size_usd).toBe(validCreateFund.target_size_usd);
    expect(fund.status).toBe(validCreateFund.status);
    expect(fund).toHaveProperty("id");
  });

  it("returns target_size_usd as a number", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      payload: validCreateFund,
    });

    expect(typeof res.json().target_size_usd).toBe("number");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      payload: { ...validCreateFund, status: "Invalid" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid vintage_year", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      payload: { ...validCreateFund, vintage_year: 1800 },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("GET /funds/:id", () => {
  it("returns a fund by id", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/funds",
      payload: validCreateFund,
    });
    const { id } = created.json();

    const res = await app.inject({ method: "GET", url: `/funds/${id}` });

    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it("returns 404 for non-existent fund", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000",
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for invalid UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/not-a-uuid",
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /funds/:id", () => {
  it("updates a fund", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/funds",
      payload: validCreateFund,
    });
    const { id } = created.json();

    const res = await app.inject({
      method: "PUT",
      url: `/funds/${id}`,
      payload: { name: "Updated Fund" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Updated Fund");
  });

  it("returns 404 for non-existent fund", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/funds/550e8400-e29b-41d4-a716-446655440000",
      payload: { name: "Updated" },
    });

    expect(res.statusCode).toBe(404);
  });
});
