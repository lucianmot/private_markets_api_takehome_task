# Phase 5 — Investor Endpoints

## Goal

Implement 2 endpoints for investors (list and create). Email uniqueness is enforced by the database unique constraint, handled via the global error handler's Prisma P2002 branch.

## Prerequisites

- Phase 4 complete (established Route → Service → Repository pattern)

## Steps

### 5.1 — Zod schema (`src/schemas/investor.schema.ts`)

**CreateInvestorSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `name` | z.string() | min(1) |
| `investor_type` | z.enum() | ["Individual", "Institution", "FamilyOffice"] |
| `email` | z.string() | email() |

Export: `CreateInvestorInput` (inferred type)

### 5.2 — Repository (`src/repositories/investor.repository.ts`)

2 functions:

```ts
findAll()    → prisma.investor.findMany({ orderBy: { created_at: "desc" } })
create(data) → prisma.investor.create({ data })
```

### 5.3 — Service (`src/services/investor.service.ts`)

Thin pass-through (no Decimal fields to serialise):

```ts
getAllInvestors() → findAll()
createInvestor(data) → create(data)
```

No special serialisation needed — all fields are native types.

### 5.4 — Routes (`src/routes/investors.ts`)

| Method | Path         | Schema                     | Handler                      |
| ------ | ------------ | -------------------------- | ---------------------------- |
| GET    | `/investors` | —                          | `getAllInvestors()` → 200    |
| POST   | `/investors` | body: CreateInvestorSchema | `createInvestor(body)` → 201 |

### 5.5 — Register routes in app.ts

```ts
import { investorRoutes } from "./routes/investors.js";
await app.register(investorRoutes);
```

## Error handling

- **Duplicate email** → Prisma throws P2002 → global error handler returns 409 Conflict
- **Invalid email format** → Zod validation → 400 with field details

## Verification

```bash
curl http://localhost:3000/investors                 # 200, list
curl -X POST http://localhost:3000/investors \
  -d '{"name":"Jane","investor_type":"Individual","email":"jane@example.com"}'
                                                      # 201
curl -X POST http://localhost:3000/investors \
  -d '{"name":"Jane2","investor_type":"Individual","email":"jane@example.com"}'
                                                      # 409, duplicate email
```

## Files created

| File                                      | Purpose                           |
| ----------------------------------------- | --------------------------------- |
| `src/schemas/investor.schema.ts`          | CreateInvestor schema + type      |
| `src/repositories/investor.repository.ts` | findAll, create                   |
| `src/services/investor.service.ts`        | getAllInvestors, createInvestor   |
| `src/routes/investors.ts`                 | 2 endpoints                       |
| `src/app.ts`                              | Modified: register investorRoutes |
