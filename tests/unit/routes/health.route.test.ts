import Fastify from "fastify";
import { healthRoutes } from "../../../src/routes/health.js";

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const app = Fastify({ logger: false });
    await app.register(healthRoutes);
    await app.ready();

    const res = await app.inject({ method: "GET", url: "/health" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
    expect(typeof body.timestamp).toBe("string");

    await app.close();
  });
});
