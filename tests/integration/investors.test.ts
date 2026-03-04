import type { FastifyInstance } from "fastify";
import { createTestApp } from "../helpers/app.js";
import { cleanDatabase } from "../helpers/db.js";
import { validCreateInvestor } from "../helpers/fixtures.js";

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

describe("GET /investors", () => {
  it("returns empty array when no investors exist", async () => {
    const res = await app.inject({ method: "GET", url: "/investors" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("returns list of investors", async () => {
    await app.inject({
      method: "POST",
      url: "/investors",
      payload: validCreateInvestor,
    });

    const res = await app.inject({ method: "GET", url: "/investors" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });
});

describe("POST /investors", () => {
  it("creates an investor and returns 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: validCreateInvestor,
    });

    expect(res.statusCode).toBe(201);
    const investor = res.json();
    expect(investor.name).toBe(validCreateInvestor.name);
    expect(investor.investor_type).toBe(validCreateInvestor.investor_type);
    expect(investor.email).toBe(validCreateInvestor.email);
    expect(investor).toHaveProperty("id");
  });

  it("returns 409 for duplicate email", async () => {
    await app.inject({
      method: "POST",
      url: "/investors",
      payload: validCreateInvestor,
    });

    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { ...validCreateInvestor, name: "Different Name" },
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 400 for invalid email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { ...validCreateInvestor, email: "not-an-email" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid investor_type", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: { ...validCreateInvestor, investor_type: "Unknown" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/investors",
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});
