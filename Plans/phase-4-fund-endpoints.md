# Phase 4 — Fund Endpoints

## Goal

Implement the first entity layer: Zod schemas, repository, service, and 4 CRUD routes for funds. Establishes the Route → Service → Repository → Prisma pattern used by all subsequent entities.

## Prerequisites

- Phase 2 complete (Fastify app factory, error handler, Zod compilers)
- Phase 1 complete (Prisma client, Fund model)

## Architecture pattern

```
Route (HTTP + validation) → Service (business logic + serialisation) → Repository (Prisma queries)
```

## Steps

### 4.1 — Zod schemas (`src/schemas/fund.schema.ts`)

**CreateFundSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `name` | z.string() | min(1) |
| `vintage_year` | z.int() | min(1900), max(2100) |
| `target_size_usd` | z.number() | positive() |
| `status` | z.enum() | ["Fundraising", "Investing", "Closed"] |

**UpdateFundSchema:** Same fields, all optional (`.partial()`)

**FundParamsSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `id` | z.string() | uuid() |

Exports: `CreateFundInput`, `UpdateFundInput`, `FundParams` (inferred types)

### 4.2 — Repository (`src/repositories/fund.repository.ts`)

4 thin Prisma wrappers:

```ts
findAll()              → prisma.fund.findMany({ orderBy: { created_at: "desc" } })
findById(id)           → prisma.fund.findUnique({ where: { id } })
create(data)           → prisma.fund.create({ data })
update(id, data)       → prisma.fund.update({ where: { id }, data })
```

### 4.3 — Service (`src/services/fund.service.ts`)

Key responsibility: **Decimal → number serialisation**

Prisma returns `Decimal` objects for `target_size_usd`. The service converts these to plain numbers before returning to the route layer:

```ts
function serialize(fund) {
  return { ...fund, target_size_usd: Number(fund.target_size_usd) };
}
```

Functions:
| Function | Logic |
|----------|-------|
| `getAllFunds()` | findAll → serialize each |
| `getFundById(id)` | findById → NotFoundError if null → serialize |
| `createFund(data)` | create → serialize |
| `updateFund(id, data)` | update → serialize (Prisma throws P2025 if not found) |

### 4.4 — Routes (`src/routes/funds.ts`)

Uses `ZodTypeProvider` for typed request validation:

| Method | Path         | Schema                          | Handler                      |
| ------ | ------------ | ------------------------------- | ---------------------------- |
| GET    | `/funds`     | —                               | `getAllFunds()` → 200        |
| POST   | `/funds`     | body: CreateFundSchema          | `createFund(body)` → 201     |
| GET    | `/funds/:id` | params: FundParamsSchema        | `getFundById(id)` → 200      |
| PUT    | `/funds/:id` | params + body: UpdateFundSchema | `updateFund(id, body)` → 200 |

### 4.5 — Register routes in app.ts

```ts
import { fundRoutes } from "./routes/funds.js";
await app.register(fundRoutes);
```

## Verification

```bash
yarn dev
curl http://localhost:3000/funds                    # 200, list
curl -X POST http://localhost:3000/funds -H "Content-Type: application/json" \
  -d '{"name":"Test","vintage_year":2024,"target_size_usd":100000,"status":"Fundraising"}'
                                                     # 201, created
curl http://localhost:3000/funds/<id>                # 200, single
curl -X PUT http://localhost:3000/funds/<id> \
  -d '{"name":"Updated"}'                           # 200, updated
curl http://localhost:3000/funds/bad-uuid            # 400, Zod validation
curl http://localhost:3000/funds/00000000-0000-0000-0000-000000000000  # 404
```

## Files created

| File                                  | Purpose                                            |
| ------------------------------------- | -------------------------------------------------- |
| `src/schemas/fund.schema.ts`          | CreateFund, UpdateFund, FundParams schemas + types |
| `src/repositories/fund.repository.ts` | findAll, findById, create, update                  |
| `src/services/fund.service.ts`        | Business logic + Decimal serialisation             |
| `src/routes/funds.ts`                 | 4 endpoints with Zod validation                    |
| `src/app.ts`                          | Modified: register fundRoutes                      |
