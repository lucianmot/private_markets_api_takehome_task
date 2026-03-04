# Phase 2 — App Foundation

## Goal

Build the Fastify app factory with Zod validation, Pino logging, CORS, custom error classes, a global error handler, and the health check endpoint.

## Prerequisites

- Phase 1 complete (Prisma singleton exists)

## Steps

### 2.1 — Error classes (`src/lib/errors.ts`)

Three custom error classes:

```ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "ConflictError";
  }
}
```

### 2.2 — Global error handler (`src/lib/error-handler.ts`)

Exported as a Fastify error handler function with this precedence:

1. **Zod validation errors** (`error.name === "ZodError"`) → 400 with field-level issue details
2. **Custom AppError** → uses `error.statusCode`
3. **Prisma known request errors** (`@prisma/client/runtime/library`):
   - `P2002` (unique constraint) → 409
   - `P2025` (record not found) → 404
   - `P2003` (foreign key violation) → 400
4. **Fastify validation errors** (`error.validation` exists) → 400
5. **Unhandled errors** → 500, logged to Sentry via `Sentry.captureException()`

Response shape: `{ error: string, statusCode: number, details?: [...] }`

### 2.3 — App factory (`src/app.ts`)

```ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { errorHandler } from "./lib/error-handler.js";
import { healthRoutes } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });

  app.setErrorHandler(errorHandler);

  await app.register(healthRoutes);
  // Additional route registrations added in later phases

  return app;
}
```

Key details:

- Zod compiler pair from `fastify-type-provider-zod` replaces default Ajv
- Pino-pretty transport in non-production, structured JSON in production
- LOG_LEVEL configurable via env (defaults to "info")
- CORS enabled with `origin: true`

### 2.4 — Health route (`src/routes/health.ts`)

```ts
import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));
}
```

Single endpoint: `GET /health` → `{ status, uptime, timestamp }`

### 2.5 — Server entry point (`src/server.ts`)

```ts
import { buildApp } from "./app.js";

const start = async () => {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "0.0.0.0";

  await app.listen({ port, host });
};

start();
```

## Verification

```bash
yarn dev
# Server starts, logs are pretty-printed
curl http://localhost:3000/health
# { "status": "ok", "uptime": 1.234, "timestamp": "2024-..." }
```

## Files created

| File                       | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `src/lib/errors.ts`        | AppError, NotFoundError, ConflictError classes              |
| `src/lib/error-handler.ts` | Global error handler (Zod, Prisma, Fastify, 500)            |
| `src/app.ts`               | Fastify app factory with Zod compilers, CORS, error handler |
| `src/routes/health.ts`     | `GET /health` endpoint                                      |
| `src/server.ts`            | Server entry point (listen on port 3000)                    |
