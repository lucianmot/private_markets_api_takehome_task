# Phase 8 — Transaction Endpoints

## Goal

Implement 5 extended endpoints: transaction processing with fee calculation, transaction reversal, fund total value, and admin fee recalculation. Also add a `reason` field to the Transaction model via migration.

## Prerequisites

- Phase 7 complete (test infrastructure, fund/investor repos for validation)
- Phase 2 complete (error handler for validation errors)

## Steps

### 8.1 — Database migration

Add `reason` (String?) and `reversed_at` (DateTime?) fields to the Transaction model:

```bash
npx prisma migrate dev --name add-transaction-reason
```

(Note: In the actual implementation, these fields were part of the initial schema. If building from scratch incrementally, this migration would be needed here.)

### 8.2 — Zod schemas (`src/schemas/transaction.schema.ts`)

**ProcessTransactionSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `fund_id` | z.string() | uuid() |
| `amount` | z.number() | positive() |
| `fee_percentage` | z.number() | min(0) |
| `auto_calculate_fees` | z.boolean() | |
| `bypass_validation` | z.boolean() | |

**ReverseTransactionSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `reason` | z.string() | min(1) |
| `refund_fees` | z.boolean() | |

**RecalculateFeesSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `fund_id` | z.string() | uuid() |
| `new_fee_percentage` | z.number() | min(0) |
| `apply_retroactively` | z.boolean() | |

**TotalValueQuerySchema:**
| Field | Type | Validation |
|-------|------|------------|
| `include_pending` | z.enum(["true","false"]).optional() | transformed to boolean |

**TransactionParamsSchema:**
| Field | Type | Validation |
|-------|------|------------|
| `transaction_id` | z.string() | uuid() |

### 8.3 — Fee service (`src/services/fee.service.ts`)

Pure functions (no I/O, no dependencies):

```ts
calculateFees(amount: number, feePercentage: number): number
// Returns amount * (feePercentage / 100), rounded to 2 decimal places

shouldAutoCalculate(autoCalculateFees: boolean, bypassValidation: boolean): boolean
// Returns autoCalculateFees && !bypassValidation
```

These are easily unit-testable in isolation.

### 8.4 — Transaction repository (`src/repositories/transaction.repository.ts`)

7 functions:

| Function                                     | Prisma method  | Notes                                                           |
| -------------------------------------------- | -------------- | --------------------------------------------------------------- |
| `findAll()`                                  | `findMany`     | orderBy created_at desc                                         |
| `findById(txnId)`                            | `findUnique`   | where: { transaction_id }                                       |
| `create(data)`                               | `create`       |                                                                 |
| `update(txnId, data)`                        | `update`       | Prisma.TransactionUpdateInput                                   |
| `findByFundIdAndStatus(fundId, status)`      | `findMany`     | where: { fund_id, status }                                      |
| `sumAmountByFundIdAndStatus(fundId, status)` | `aggregate`    | \_sum: { amount: true }, \_count: true → returns { sum, count } |
| `updateManyFeesByFundId(newFee, updates[])`  | `$transaction` | Batch update via `prisma.$transaction([...])`                   |

`updateManyFeesByFundId` uses `prisma.$transaction()` with an array of update operations — one per transaction — to atomically update `fee_percentage` and `calculated_fees` for all matching transactions.

### 8.5 — Transaction service (`src/services/transaction.service.ts`)

Complex business logic:

| Function                                              | Logic                                                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getAllTransactions()`                                | findAll → serialize (Decimal → number for amount, fee_percentage, calculated_fees)                                                                     |
| `processTransaction(data)`                            | Validate fund exists → calculate fees if auto → create → serialize                                                                                     |
| `reverseTransaction(txnId, reason, refundFees)`       | Find txn → validate not already reversed → update status/reason/reversed_at → optionally zero out fees → serialize                                     |
| `getFundTotalValue(fundId, includePending)`           | Verify fund exists → sum completed amounts → optionally add pending → return { fund_id, total_value, completed_count, pending_count?, pending_value? } |
| `recalculateFees(fundId, newFee, applyRetroactively)` | Verify fund exists → find completed txns → recalculate each fee → batch update → return { updated_count, new_fee_percentage, transactions[] }          |

Key serialisation: All Decimal fields (`amount`, `fee_percentage`, `calculated_fees`) are converted to numbers.

### 8.6 — Transaction routes (`src/routes/transactions.ts`)

| Method | Path                                    | Schema                                  | Handler                                               |
| ------ | --------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| GET    | `/transactions`                         | —                                       | `getAllTransactions()` → 200                          |
| POST   | `/transactions/process`                 | body: ProcessTransactionSchema          | `processTransaction(body)` → 201                      |
| PUT    | `/transactions/:transaction_id/reverse` | params + body: ReverseTransactionSchema | `reverseTransaction(txnId, reason, refundFees)` → 200 |

### 8.7 — Admin routes (`src/routes/admin.ts`)

| Method | Path                      | Schema                      | Handler                                              |
| ------ | ------------------------- | --------------------------- | ---------------------------------------------------- |
| POST   | `/admin/recalculate-fees` | body: RecalculateFeesSchema | `recalculateFees(fundId, newFee, retroactive)` → 200 |

### 8.8 — Fund total value route (added to `src/routes/funds.ts`)

| Method | Path                          | Schema                                                       | Handler                                           |
| ------ | ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| GET    | `/funds/:fund_id/total-value` | params: InvestmentParamsSchema, query: TotalValueQuerySchema | `getFundTotalValue(fundId, includePending)` → 200 |

### 8.9 — Register routes in app.ts

```ts
import { transactionRoutes } from "./routes/transactions.js";
import { adminRoutes } from "./routes/admin.js";

await app.register(transactionRoutes);
await app.register(adminRoutes);
```

## Verification

```bash
# Process a transaction
curl -X POST http://localhost:3000/transactions/process \
  -d '{"fund_id":"<uuid>","amount":100000,"fee_percentage":2.5,"auto_calculate_fees":true,"bypass_validation":false}'
# 201, with calculated_fees = 2500

# Reverse it
curl -X PUT http://localhost:3000/transactions/<txn_id>/reverse \
  -d '{"reason":"Client request","refund_fees":true}'
# 200, status = "reversed"

# Fund total value
curl "http://localhost:3000/funds/<fund_id>/total-value?include_pending=true"
# 200, { total_value, completed_count, pending_value, pending_count }

# Recalculate fees
curl -X POST http://localhost:3000/admin/recalculate-fees \
  -d '{"fund_id":"<uuid>","new_fee_percentage":3.0,"apply_retroactively":true}'
# 200, { updated_count, transactions[] }
```

## Files created

| File                                         | Purpose                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `src/schemas/transaction.schema.ts`          | 5 schemas (Process, Reverse, Recalculate, TotalValueQuery, Params) |
| `src/services/fee.service.ts`                | Pure fee calculation functions                                     |
| `src/repositories/transaction.repository.ts` | 7 functions including aggregate + batch $transaction               |
| `src/services/transaction.service.ts`        | Business logic for processing, reversal, totals, recalculation     |
| `src/routes/transactions.ts`                 | 3 endpoints                                                        |
| `src/routes/admin.ts`                        | 1 admin endpoint                                                   |
| `src/routes/funds.ts`                        | Modified: added GET /funds/:fund_id/total-value                    |
| `src/app.ts`                                 | Modified: register transactionRoutes + adminRoutes                 |
