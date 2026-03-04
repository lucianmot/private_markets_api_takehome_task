# Phase 9 — Extended Tests

## Goal

Fill coverage gaps from Phase 8: add unit tests for the error handler, error classes, fee service, and transaction service edge cases. Add integration tests for transaction, admin, and extended fund endpoints. Extract error handler to its own module.

## Prerequisites

- Phase 8 complete (all 13 endpoints implemented)

## Steps

### 9.1 — Extract error handler

Move the error handler function from inline in `app.ts` to its own module:

**`src/lib/error-handler.ts`** — standalone export

This enables direct unit testing without booting Fastify.

### 9.2 — Unit tests: Error classes (`tests/unit/lib/errors.test.ts` — 10 tests)

| Test                                  | What it verifies                        |
| ------------------------------------- | --------------------------------------- |
| AppError sets statusCode and message  | Constructor args stored correctly       |
| AppError name is "AppError"           | Error name property                     |
| AppError instanceof Error             | Prototype chain                         |
| NotFoundError formats message         | `"Fund with id abc not found"` template |
| NotFoundError statusCode is 404       | Always 404                              |
| NotFoundError name is "NotFoundError" | Error name property                     |
| NotFoundError instanceof AppError     | Inheritance chain                       |
| ConflictError statusCode is 409       | Always 409                              |
| ConflictError stores message          | Custom message preserved                |
| ConflictError instanceof AppError     | Inheritance chain                       |

### 9.3 — Unit tests: Error handler (`tests/unit/lib/error-handler.test.ts` — 11 tests)

Uses a minimal Fastify instance (no Zod compilers needed) to test the error handler in isolation:

| Test                              | Scenario                                            |
| --------------------------------- | --------------------------------------------------- |
| Zod validation error → 400        | Mock error with `name: "ZodError"`, `issues: [...]` |
| AppError → uses statusCode        | Custom AppError(422, "msg")                         |
| NotFoundError → 404               | NotFoundError("Fund", "abc")                        |
| ConflictError → 409               | ConflictError("duplicate")                          |
| Prisma P2002 → 409                | Unique constraint violation                         |
| Prisma P2025 → 404                | Record not found                                    |
| Prisma P2003 → 400                | Foreign key violation                               |
| Fastify validation error → 400    | error.validation array present                      |
| Unknown error → 500               | Generic Error object                                |
| 500 calls Sentry.captureException | Spy on Sentry                                       |
| Returns correct response shape    | `{ error, statusCode }`                             |

### 9.4 — Unit tests: Fee service (`tests/unit/services/fee.service.test.ts` — 11 tests)

| Test                            | What it verifies                 |
| ------------------------------- | -------------------------------- |
| calculateFees basic             | 100000 \* 2.5% = 2500            |
| calculateFees zero fee          | 0% = 0                           |
| calculateFees zero amount       | $0 \* 5% = 0                     |
| calculateFees rounds to 2dp     | Precision check                  |
| calculateFees large numbers     | $1B \* 0.01%                     |
| calculateFees fractional        | 3.75% of $999,999                |
| shouldAutoCalculate true/false  | auto=true, bypass=false → true   |
| shouldAutoCalculate bypass=true | auto=true, bypass=true → false   |
| shouldAutoCalculate auto=false  | auto=false, bypass=false → false |
| shouldAutoCalculate both false  | false, false → false             |
| shouldAutoCalculate both true   | true, true → false               |

### 9.5 — Unit tests: Transaction service (`tests/unit/services/transaction.service.test.ts` — 21 tests)

Comprehensive mock-based tests covering:

- `getAllTransactions` — serialisation of Decimal fields
- `processTransaction` — auto fee calculation, manual fees, bypass validation, fund not found
- `reverseTransaction` — success, already reversed error, not found, refund fees flag
- `getFundTotalValue` — completed only, with pending, fund not found
- `recalculateFees` — retroactive update, non-retroactive, fund not found, no transactions

### 9.6 — Integration tests: Transactions (`tests/integration/transactions.test.ts` — 15 tests)

Full stack tests against real database:

- GET /transactions (empty, with data)
- POST /transactions/process (valid, auto fees, manual fees, invalid fund, validation errors)
- PUT /transactions/:id/reverse (valid, already reversed, refund fees, not found)

### 9.7 — Integration tests: Admin (`tests/integration/admin.test.ts` — 8 tests)

- POST /admin/recalculate-fees (retroactive, non-retroactive, invalid fund, no transactions, validation errors)

### 9.8 — Integration tests: Extended funds (`tests/integration/funds-extended.test.ts` — 9 tests)

- GET /funds/:fund_id/total-value (no transactions, completed only, with pending, invalid fund)

## Test count after this phase

| Category                                    | Count   |
| ------------------------------------------- | ------- |
| Unit: schemas                               | 51      |
| Unit: services (fund, investor, investment) | 15      |
| Unit: services (fee)                        | 11      |
| Unit: services (transaction)                | 21      |
| Unit: lib (errors + error-handler)          | 21      |
| Integration                                 | 66      |
| **Total**                                   | **185** |

## Verification

```bash
yarn test              # 119 unit tests pass
yarn test:integration  # 66 integration tests pass
```

## Files created

| File                                              | Purpose                          |
| ------------------------------------------------- | -------------------------------- |
| `src/lib/error-handler.ts`                        | Extracted error handler module   |
| `tests/unit/lib/errors.test.ts`                   | 10 error class tests             |
| `tests/unit/lib/error-handler.test.ts`            | 11 error handler tests           |
| `tests/unit/services/fee.service.test.ts`         | 11 fee service tests             |
| `tests/unit/services/transaction.service.test.ts` | 21 transaction service tests     |
| `tests/integration/transactions.test.ts`          | 15 transaction integration tests |
| `tests/integration/admin.test.ts`                 | 8 admin integration tests        |
| `tests/integration/funds-extended.test.ts`        | 9 extended fund tests            |
