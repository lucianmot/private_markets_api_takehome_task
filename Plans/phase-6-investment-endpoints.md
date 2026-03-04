# Phase 6 — Investment Endpoints

## Goal

Implement 2 nested endpoints under `/funds/:fund_id` for investments. Key challenge: dual serialisation (Decimal → number for `amount_usd`, Date → "YYYY-MM-DD" string for `investment_date`).

## Prerequisites

- Phase 4 complete (fund existence checks)
- Phase 5 complete (investor FK validation)

## Steps

### 6.1 — Zod schemas (`src/schemas/investment.schema.ts`)

**InvestmentParamsSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `fund_id` | z.string() | uuid() |

**CreateInvestmentSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `investor_id` | z.string() | uuid() |
| `amount_usd` | z.number() | positive() |
| `investment_date` | z.string() | regex `YYYY-MM-DD` format |

Exports: `InvestmentParams`, `CreateInvestmentInput`

### 6.2 — Repository (`src/repositories/investment.repository.ts`)

2 functions:

```ts
findByFundId(fundId) → prisma.investment.findMany({
  where: { fund_id: fundId },
  orderBy: { investment_date: "desc" },
})

create(fundId, data) → prisma.investment.create({
  data: {
    fund_id: fundId,
    investor_id: data.investor_id,
    amount_usd: data.amount_usd,
    investment_date: new Date(data.investment_date),  // string → Date conversion
  },
})
```

**Important:** The `create` function converts the `investment_date` string ("YYYY-MM-DD") to a JavaScript `Date` object before passing to Prisma.

### 6.3 — Service (`src/services/investment.service.ts`)

Two serialisation concerns:

- `amount_usd`: Prisma Decimal → `Number()`
- `investment_date`: JavaScript Date → `"YYYY-MM-DD"` string via `.toISOString().split("T")[0]`

```ts
function serialize(investment) {
  return {
    ...investment,
    amount_usd: Number(investment.amount_usd),
    investment_date: investment.investment_date.toISOString().split("T")[0],
  };
}
```

Functions:
| Function | Logic |
|----------|-------|
| `getInvestmentsByFundId(fundId)` | Verify fund exists (getFundById) → findByFundId → serialize each |
| `createInvestment(fundId, data)` | Verify fund exists → create → serialize |

Both functions call `getFundById(fundId)` from the fund service, which throws `NotFoundError` if the fund doesn't exist.

### 6.4 — Routes (`src/routes/investments.ts`)

| Method | Path                          | Schema                                | Handler                                 |
| ------ | ----------------------------- | ------------------------------------- | --------------------------------------- |
| GET    | `/funds/:fund_id/investments` | params: InvestmentParamsSchema        | `getInvestmentsByFundId(fund_id)` → 200 |
| POST   | `/funds/:fund_id/investments` | params + body: CreateInvestmentSchema | `createInvestment(fund_id, body)` → 201 |

### 6.5 — Register routes in app.ts

```ts
import { investmentRoutes } from "./routes/investments.js";
await app.register(investmentRoutes);
```

## Error handling

- **Non-existent fund** → `NotFoundError` from fund service → 404
- **Non-existent investor** → Prisma P2003 (FK violation) → 400
- **Invalid date format** → Zod validation → 400
- **Invalid UUID** → Zod validation → 400

## Verification

```bash
curl http://localhost:3000/funds/<fund_id>/investments  # 200, list
curl -X POST http://localhost:3000/funds/<fund_id>/investments \
  -d '{"investor_id":"<uuid>","amount_usd":500000,"investment_date":"2024-06-15"}'
                                                         # 201
# Dates come back as "2024-06-15" strings, amounts as numbers
```

## Files created

| File                                        | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `src/schemas/investment.schema.ts`          | InvestmentParams, CreateInvestment schemas + types |
| `src/repositories/investment.repository.ts` | findByFundId, create (with Date conversion)        |
| `src/services/investment.service.ts`        | Dual serialisation (Decimal + Date)                |
| `src/routes/investments.ts`                 | 2 nested endpoints under /funds/:fund_id           |
| `src/app.ts`                                | Modified: register investmentRoutes                |
