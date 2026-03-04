# Phase 2.5 — Swagger/OpenAPI Documentation

## Goal

Add interactive API documentation via Swagger UI and auto-generated OpenAPI 3.0 spec, leveraging the existing Zod schemas through `fastify-type-provider-zod`.

## Prerequisites

- Phase 2 complete (Fastify app factory with Zod compilers)

## Steps

### 2.5.1 — Install dependencies

```bash
yarn add @fastify/swagger @fastify/swagger-ui
```

These are peer dependencies of `fastify-type-provider-zod` (which was already installed in Phase 0).

### 2.5.2 — Register Swagger plugins (`src/app.ts`)

Added `@fastify/swagger` and `@fastify/swagger-ui` registration in the app factory, **after** Zod compilers and CORS, **before** route registration:

```ts
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Titanbay Funds API",
      description:
        "RESTful API for managing private market funds and investor commitments",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});
```

Key details:

- `jsonSchemaTransform` from `fastify-type-provider-zod` converts Zod schemas to JSON Schema for OpenAPI
- All routes with Zod `schema` definitions automatically appear in the docs
- Swagger UI served at `/docs`, OpenAPI JSON at `/docs/json`

## Verification

```bash
yarn dev
curl http://localhost:3000/docs        # Swagger UI (200 HTML)
curl http://localhost:3000/docs/json   # OpenAPI 3.0 JSON spec
```

## Files modified

| File           | Change                                                             |
| -------------- | ------------------------------------------------------------------ |
| `package.json` | Added `@fastify/swagger`, `@fastify/swagger-ui` dependencies       |
| `src/app.ts`   | Registered Swagger + Swagger UI plugins with `jsonSchemaTransform` |
