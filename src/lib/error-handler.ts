import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./errors.js";

interface PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: { target?: string[]; cause?: string };
}

function isPrismaError(err: unknown): err is PrismaClientKnownRequestError {
  return (
    err instanceof Error &&
    err.constructor.name === "PrismaClientKnownRequestError" &&
    "code" in err
  );
}

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  // Zod validation errors
  if (error.name === "ZodError" && "issues" in error) {
    const issues = (error as unknown as { issues: Array<{ message: string }> })
      .issues;
    return reply.status(400).send({
      error: "Validation Error",
      statusCode: 400,
      details: issues,
    });
  }

  // Custom app errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      statusCode: error.statusCode,
      message: error.message,
    });
  }

  // Prisma known request errors
  if (isPrismaError(error)) {
    switch (error.code) {
      case "P2002":
        return reply.status(409).send({
          error: "Conflict",
          statusCode: 409,
          message: "A record with this value already exists",
        });
      case "P2025":
        return reply.status(404).send({
          error: "Not Found",
          statusCode: 404,
          message: error.meta?.cause ?? "Record not found",
        });
      case "P2003":
        return reply.status(400).send({
          error: "Bad Request",
          statusCode: 400,
          message: "Referenced record does not exist",
        });
    }
  }

  // Fastify validation errors
  if ("validation" in error) {
    return reply.status(400).send({
      error: "Validation Error",
      statusCode: 400,
      message: error.message,
    });
  }

  // Unhandled errors — log and return 500
  _request.log.error(error, "Unhandled error");
  return reply.status(500).send({
    error: "Internal Server Error",
    statusCode: 500,
    message: "An unexpected error occurred",
  });
}
