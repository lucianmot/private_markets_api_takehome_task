# Phase 10 — Swagger Response Documentation

## Context

Our routes currently only declare request schemas (body, params, querystring) but no `response` schemas. This means Swagger UI only documents the happy path with no response shape, and doesn't show error status codes (400, 404, 409, 500). Adding response schemas to route definitions makes the OpenAPI spec complete — this is a documentation-only change, no runtime behaviour changes.

## Changes

### 1. Create shared response schemas — `src/schemas/response.schema.ts`

Define reusable Zod schemas for error responses and each entity's response shape:

```ts
// Error responses (reused across all routes)
ErrorResponseSchema    → { error: string, statusCode: number, message: string }
ValidationErrorSchema  → { error: string, statusCode: number, details: array }

// Entity response schemas (match what services actually return)
FundResponseSchema         → { id, name, vintage_year, target_size_usd, status, created_at }
InvestorResponseSchema     → { id, name, investor_type, email, created_at }
InvestmentResponseSchema   → { id, fund_id, investor_id, amount_usd, investment_date }
TransactionResponseSchema  → { transaction_id, fund_id, amount, fee_percentage, calculated_fees, auto_calculate_fees, bypass_validation, status, created_at, reason, reversed_at }
TotalValueResponseSchema   → { fund_id, total_value, completed_count, pending_count?, pending_value? }
RecalculateFeesResponseSchema → { updated_count, new_fee_percentage, transactions: array }
```

### 2. Add response schemas to each route file

For each route, add a `response` property to the existing `schema` object. The response schemas map status codes to Zod schemas:

**`src/routes/funds.ts`**

- `GET /funds` → `200: z.array(FundResponseSchema)`
- `POST /funds` → `201: FundResponseSchema`, `400: ValidationErrorSchema`
- `GET /funds/:id` → `200: FundResponseSchema`, `404: ErrorResponseSchema`
- `PUT /funds/:id` → `200: FundResponseSchema`, `400: ValidationErrorSchema`, `404: ErrorResponseSchema`
- `GET /funds/:fund_id/total-value` → `200: TotalValueResponseSchema`, `404: ErrorResponseSchema`

**`src/routes/investors.ts`**

- `GET /investors` → `200: z.array(InvestorResponseSchema)`
- `POST /investors` → `201: InvestorResponseSchema`, `400: ValidationErrorSchema`, `409: ErrorResponseSchema`

**`src/routes/investments.ts`**

- `GET /funds/:fund_id/investments` → `200: z.array(InvestmentResponseSchema)`, `404: ErrorResponseSchema`
- `POST /funds/:fund_id/investments` → `201: InvestmentResponseSchema`, `400: ValidationErrorSchema`, `404: ErrorResponseSchema`

**`src/routes/transactions.ts`**

- `GET /transactions` → `200: z.array(TransactionResponseSchema)`
- `POST /transactions/process` → `201: TransactionResponseSchema`, `400: ValidationErrorSchema`, `404: ErrorResponseSchema`
- `PUT /transactions/:transaction_id/reverse` → `200: TransactionResponseSchema`, `400: ValidationErrorSchema`, `404: ErrorResponseSchema`, `409: ErrorResponseSchema`

**`src/routes/admin.ts`**

- `POST /admin/recalculate-fees` → `200: RecalculateFeesResponseSchema`, `400: ValidationErrorSchema`, `404: ErrorResponseSchema`

### 3. No other files change

The error handler, services, and repositories are untouched. This is purely adding schema metadata for Swagger generation.

## Files to create/modify

| File                             | Action                                              |
| -------------------------------- | --------------------------------------------------- |
| `src/schemas/response.schema.ts` | **Create** — shared error + entity response schemas |
| `src/routes/funds.ts`            | **Modify** — add response schemas to all 5 routes   |
| `src/routes/investors.ts`        | **Modify** — add response schemas to 2 routes       |
| `src/routes/investments.ts`      | **Modify** — add response schemas to 2 routes       |
| `src/routes/transactions.ts`     | **Modify** — add response schemas to 3 routes       |
| `src/routes/admin.ts`            | **Modify** — add response schemas to 1 route        |

## Verification

```bash
yarn lint
yarn test
yarn test:integration
yarn dev
# Then check http://localhost:3000/docs — each endpoint should now show response schemas and error codes
```
