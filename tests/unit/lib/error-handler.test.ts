import { errorHandler } from "../../../src/lib/error-handler.js";
import {
  AppError,
  NotFoundError,
  ConflictError,
} from "../../../src/lib/errors.js";
import * as Sentry from "@sentry/node";

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}));

function createMockReply() {
  const reply = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      reply.statusCode = code;
      return reply;
    },
    send(payload: unknown) {
      reply.body = payload;
      return reply;
    },
  };
  return reply;
}

function createMockRequest() {
  return {
    log: { error: vi.fn() },
  };
}

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles ZodError → 400", () => {
    const error = new Error("Validation failed");
    error.name = "ZodError";
    (error as unknown as Record<string, unknown>).issues = [
      { message: "Required" },
    ];

    const reply = createMockReply();
    errorHandler(error as never, createMockRequest() as never, reply as never);

    expect(reply.statusCode).toBe(400);
    expect((reply.body as Record<string, unknown>).error).toBe(
      "Validation Error",
    );
  });

  it("handles AppError → uses statusCode", () => {
    const reply = createMockReply();
    errorHandler(
      new AppError(422, "custom") as never,
      createMockRequest() as never,
      reply as never,
    );

    expect(reply.statusCode).toBe(422);
    expect((reply.body as Record<string, unknown>).message).toBe("custom");
  });

  it("handles NotFoundError → 404", () => {
    const reply = createMockReply();
    errorHandler(
      new NotFoundError("Fund", "abc") as never,
      createMockRequest() as never,
      reply as never,
    );

    expect(reply.statusCode).toBe(404);
  });

  it("handles ConflictError → 409", () => {
    const reply = createMockReply();
    errorHandler(
      new ConflictError("duplicate") as never,
      createMockRequest() as never,
      reply as never,
    );

    expect(reply.statusCode).toBe(409);
  });

  it("handles Prisma P2002 → 409", () => {
    const error = new Error("Unique constraint");
    Object.defineProperty(error, "constructor", {
      value: { name: "PrismaClientKnownRequestError" },
    });
    (error as unknown as Record<string, unknown>).code = "P2002";

    const reply = createMockReply();
    errorHandler(error as never, createMockRequest() as never, reply as never);

    expect(reply.statusCode).toBe(409);
  });

  it("handles Prisma P2025 → 404", () => {
    const error = new Error("Record not found");
    Object.defineProperty(error, "constructor", {
      value: { name: "PrismaClientKnownRequestError" },
    });
    (error as unknown as Record<string, unknown>).code = "P2025";

    const reply = createMockReply();
    errorHandler(error as never, createMockRequest() as never, reply as never);

    expect(reply.statusCode).toBe(404);
  });

  it("handles Prisma P2003 → 400", () => {
    const error = new Error("Foreign key constraint");
    Object.defineProperty(error, "constructor", {
      value: { name: "PrismaClientKnownRequestError" },
    });
    (error as unknown as Record<string, unknown>).code = "P2003";

    const reply = createMockReply();
    errorHandler(error as never, createMockRequest() as never, reply as never);

    expect(reply.statusCode).toBe(400);
    expect((reply.body as Record<string, unknown>).message).toBe(
      "Referenced record does not exist",
    );
  });

  it("handles Fastify validation error → 400", () => {
    const error = new Error("validation failed");
    (error as unknown as Record<string, unknown>).validation = [
      { message: "bad" },
    ];

    const reply = createMockReply();
    errorHandler(error as never, createMockRequest() as never, reply as never);

    expect(reply.statusCode).toBe(400);
    expect((reply.body as Record<string, unknown>).error).toBe(
      "Validation Error",
    );
  });

  it("handles unknown error → 500", () => {
    const reply = createMockReply();
    errorHandler(
      new Error("unexpected") as never,
      createMockRequest() as never,
      reply as never,
    );

    expect(reply.statusCode).toBe(500);
    expect((reply.body as Record<string, unknown>).message).toBe(
      "An unexpected error occurred",
    );
  });

  it("calls Sentry.captureException on 500", () => {
    const error = new Error("unexpected");
    const reply = createMockReply();
    errorHandler(error as never, createMockRequest() as never, reply as never);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("returns correct response shape", () => {
    const reply = createMockReply();
    errorHandler(
      new AppError(422, "msg") as never,
      createMockRequest() as never,
      reply as never,
    );

    const body = reply.body as Record<string, unknown>;
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("statusCode");
  });
});
