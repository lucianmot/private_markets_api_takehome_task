# Phase 7 — Core Tests

## Goal

Build the test infrastructure and write unit + integration tests for the 8 core endpoints (Phases 4-6: funds, investors, investments). Establishes testing patterns used by all subsequent test phases.

## Prerequisites

- Phase 6 complete (all 8 core endpoints implemented)
- Docker test database running (port 5433)

## Steps

### 7.1 — Test helpers

#### `tests/helpers/fixtures.ts`

Mock data factories with sensible defaults (all accept `overrides` parameter):

```ts
mockFund(overrides?)       // UUID, "Test Fund", 2024, $1M, Fundraising
mockInvestor(overrides?)   // UUID, "Test Investor", Individual, test@example.com
mockInvestment(overrides?) // UUID, fund_id, investor_id, $1M, "2024-01-01"
mockTransaction(overrides?) // UUID, fund_id, $100K, 2.5%, completed
```

Request body templates for integration tests:

```ts
validCreateFund; // { name, vintage_year, target_size_usd, status }
validCreateInvestor; // { name, investor_type, email }
validCreateInvestment; // { investor_id, amount_usd, investment_date }
validProcessTransaction; // { fund_id, amount, fee_percentage, ... }
validReverseTransaction; // { reason, refund_fees }
validRecalculateFees; // { fund_id, new_fee_percentage, apply_retroactively }
```

#### `tests/helpers/app.ts`

```ts
import { buildApp } from "../../src/app.js";
export async function createTestApp() {
  return buildApp();
}
```

#### `tests/helpers/db.ts`

```ts
import { prisma } from "../../src/lib/prisma.js";
export async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.fund.deleteMany();
}
```

Deletion order matters — respects FK constraints (transactions first, then investments, investors, funds).

### 7.2 — Unit tests: Schemas (51 tests)

| Test file                    | Tests | What it covers                                                                   |
| ---------------------------- | ----- | -------------------------------------------------------------------------------- |
| `fund.schema.test.ts`        | 16    | Valid/invalid create + update, FundParams UUID validation                        |
| `investor.schema.test.ts`    | 6     | Valid/invalid create, email format, enum values                                  |
| `investment.schema.test.ts`  | 8     | Valid/invalid create, date format, UUID params                                   |
| `transaction.schema.test.ts` | 21    | ProcessTransaction, ReverseTransaction, RecalculateFees, TotalValueQuery schemas |

Pattern: Call `.parse()` or `.safeParse()` directly on Zod schemas, assert success/failure and error details.

### 7.3 — Unit tests: Services (36 tests)

| Test file                    | Tests | What it covers                                                                             |
| ---------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| `fund.service.test.ts`       | 6     | getAllFunds, getFundById (found/not found), createFund, updateFund + Decimal serialisation |
| `investor.service.test.ts`   | 3     | getAllInvestors, createInvestor                                                            |
| `investment.service.test.ts` | 6     | getInvestmentsByFundId, createInvestment + dual serialisation (Decimal + Date)             |

Pattern: Mock the repository layer with `vi.mock()`, verify service calls correct repo methods with correct args, verify serialisation (Decimal → number, Date → string).

### 7.4 — Integration tests: Core endpoints (34 tests)

All integration tests use `createTestApp()` + `app.inject()` against the real test database.

| Test file             | Tests | Endpoints covered                                                                              |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| `health.test.ts`      | 1     | GET /health                                                                                    |
| `funds.test.ts`       | 11    | GET /funds, POST /funds, GET /funds/:id, PUT /funds/:id + validation errors + 404s             |
| `investors.test.ts`   | 8     | GET /investors, POST /investors + duplicate email 409 + validation errors                      |
| `investments.test.ts` | 14    | GET /funds/:fund_id/investments, POST + fund not found 404 + investor FK 400 + date validation |

Pattern per test file:

```ts
let app: FastifyInstance;
beforeAll(async () => {
  app = await createTestApp();
});
afterAll(async () => {
  await app.close();
});
beforeEach(async () => {
  await cleanDatabase();
});
```

Each test uses `app.inject()` — no real HTTP, runs in-process.

### 7.5 — Integration test setup

`tests/global-setup.integration.ts` runs `prisma db push --accept-data-loss` before all integration tests to ensure the test database schema matches the Prisma schema.

## Test count after this phase

| Category       | Count   |
| -------------- | ------- |
| Unit: schemas  | 51      |
| Unit: services | 36      |
| Integration    | 34      |
| **Total**      | **121** |

## Verification

```bash
yarn test              # all unit tests pass
yarn test:integration  # all integration tests pass (requires docker db-test)
```

## Files created

| File                                             | Purpose                                      |
| ------------------------------------------------ | -------------------------------------------- |
| `tests/helpers/fixtures.ts`                      | Mock data factories + request body templates |
| `tests/helpers/app.ts`                           | Test app factory                             |
| `tests/helpers/db.ts`                            | Database cleanup (respects FK order)         |
| `tests/unit/schemas/fund.schema.test.ts`         | 16 schema validation tests                   |
| `tests/unit/schemas/investor.schema.test.ts`     | 6 schema validation tests                    |
| `tests/unit/schemas/investment.schema.test.ts`   | 8 schema validation tests                    |
| `tests/unit/schemas/transaction.schema.test.ts`  | 21 schema validation tests                   |
| `tests/unit/services/fund.service.test.ts`       | 6 service tests                              |
| `tests/unit/services/investor.service.test.ts`   | 3 service tests                              |
| `tests/unit/services/investment.service.test.ts` | 6 service tests                              |
| `tests/integration/health.test.ts`               | 1 health check test                          |
| `tests/integration/funds.test.ts`                | 11 fund endpoint tests                       |
| `tests/integration/investors.test.ts`            | 8 investor endpoint tests                    |
| `tests/integration/investments.test.ts`          | 14 investment endpoint tests                 |
