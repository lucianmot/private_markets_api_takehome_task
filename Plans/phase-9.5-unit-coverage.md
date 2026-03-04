# Phase 9.5 — Unit Test Coverage to 95%+

## Goal

Add unit tests for the remaining untested layers — routes, app.ts bootstrap, and repositories — to push unit test statement coverage from ~62% to ~97%.

## Prerequisites

- Phase 9 complete (error handler extracted, 185 tests passing)

## Coverage before this phase

```
Stmts: 61.78%  |  Branch: 81.81%  |  Lines: 61.33%
```

Uncovered: all route files (0%), all repository files (0%), app.ts (0%)

## Steps

### 9.5.1 — Health route test (`tests/unit/routes/health.route.test.ts` — 1 test)

Simplest route — no mocks needed (no service dependency):

```ts
// Create Fastify instance, register healthRoutes, inject GET /health
// Assert: 200, body has status:"ok", uptime (number), timestamp (string)
```

### 9.5.2 — Fund route tests (`tests/unit/routes/funds.route.test.ts` — 5 tests)

Mock: `fund.service.js`, `transaction.service.js`

| Test                                  | Endpoint          | Assertion                         |
| ------------------------------------- | ----------------- | --------------------------------- |
| GET /funds → 200                      | getAllFunds       | Returns mocked array              |
| POST /funds → 201                     | createFund        | Called with body, returns created |
| GET /funds/:id → 200                  | getFundById       | Called with id param              |
| PUT /funds/:id → 200                  | updateFund        | Called with id + body             |
| GET /funds/:fund_id/total-value → 200 | getFundTotalValue | Called with fund_id + query       |

Setup pattern:

```ts
const app = Fastify({ logger: false });
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(fundRoutes);
await app.ready();
```

### 9.5.3 — Investor route tests (`tests/unit/routes/investors.route.test.ts` — 2 tests)

Mock: `investor.service.js`

| Test                  | Endpoint        |
| --------------------- | --------------- |
| GET /investors → 200  | getAllInvestors |
| POST /investors → 201 | createInvestor  |

### 9.5.4 — Investment route tests (`tests/unit/routes/investments.route.test.ts` — 2 tests)

Mock: `investment.service.js`

| Test                                   | Endpoint               |
| -------------------------------------- | ---------------------- |
| GET /funds/:fund_id/investments → 200  | getInvestmentsByFundId |
| POST /funds/:fund_id/investments → 201 | createInvestment       |

### 9.5.5 — Transaction route tests (`tests/unit/routes/transactions.route.test.ts` — 3 tests)

Mock: `transaction.service.js`

| Test                                | Endpoint           | Extra assertion                                 |
| ----------------------------------- | ------------------ | ----------------------------------------------- |
| GET /transactions → 200             | getAllTransactions |                                                 |
| POST /transactions/process → 201    | processTransaction |                                                 |
| PUT /transactions/:id/reverse → 200 | reverseTransaction | Verify called with (txnId, reason, refund_fees) |

### 9.5.6 — Admin route tests (`tests/unit/routes/admin.route.test.ts` — 1 test)

Mock: `transaction.service.js`

| Test                               | Endpoint        | Extra assertion                                                       |
| ---------------------------------- | --------------- | --------------------------------------------------------------------- |
| POST /admin/recalculate-fees → 200 | recalculateFees | Verify called with (fund_id, new_fee_percentage, apply_retroactively) |

### 9.5.7 — App bootstrap tests (`tests/unit/app.test.ts` — 2 tests)

Mock ALL service modules + `prisma.js` to avoid database connections:

```ts
vi.mock("../../src/services/fund.service.js", () => ({ ... }));
vi.mock("../../src/services/investor.service.js", () => ({ ... }));
vi.mock("../../src/services/investment.service.js", () => ({ ... }));
vi.mock("../../src/services/transaction.service.js", () => ({ ... }));
vi.mock("../../src/lib/prisma.js", () => ({ prisma: {} }));
```

| Test                              | Assertion                          |
| --------------------------------- | ---------------------------------- |
| buildApp returns Fastify instance | `typeof app.inject === "function"` |
| All routes registered             | GET /health → 200                  |

### 9.5.8 — Fund repository tests (`tests/unit/repositories/fund.repository.test.ts` — 4 tests)

Mock: `src/lib/prisma.js` with `vi.fn()` stubs for `prisma.fund.*`

| Test     | Verifies                                        |
| -------- | ----------------------------------------------- |
| findAll  | `findMany({ orderBy: { created_at: "desc" } })` |
| findById | `findUnique({ where: { id } })`                 |
| create   | `create({ data })`                              |
| update   | `update({ where: { id }, data })`               |

### 9.5.9 — Investor repository tests (`tests/unit/repositories/investor.repository.test.ts` — 2 tests)

| Test    | Verifies                                        |
| ------- | ----------------------------------------------- |
| findAll | `findMany({ orderBy: { created_at: "desc" } })` |
| create  | `create({ data })`                              |

### 9.5.10 — Investment repository tests (`tests/unit/repositories/investment.repository.test.ts` — 2 tests)

| Test         | Verifies                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| findByFundId | `findMany({ where: { fund_id }, orderBy: { investment_date: "desc" } })` |
| create       | Date string → `new Date()` conversion, correct data shape                |

### 9.5.11 — Transaction repository tests (`tests/unit/repositories/transaction.repository.test.ts` — 7 tests)

| Test                       | Verifies                                        |
| -------------------------- | ----------------------------------------------- |
| findAll                    | `findMany({ orderBy: { created_at: "desc" } })` |
| findById                   | `findUnique({ where: { transaction_id } })`     |
| create                     | `create({ data })` with all fields              |
| update                     | `update({ where: { transaction_id }, data })`   |
| findByFundIdAndStatus      | `findMany({ where: { fund_id, status } })`      |
| sumAmountByFundIdAndStatus | `aggregate` → mapped to `{ sum, count }`        |
| updateManyFeesByFundId     | `$transaction([...])` with array of updates     |

## Test count after this phase

| Category           | Count   |
| ------------------ | ------- |
| Unit: schemas      | 51      |
| Unit: services     | 47      |
| Unit: lib          | 21      |
| Unit: routes       | 14      |
| Unit: repositories | 15      |
| Unit: app          | 2       |
| **Unit total**     | **150** |
| Integration        | 66      |
| **Grand total**    | **216** |

## Coverage after this phase

```
Stmts: 96.85%  |  Branch: 87.27%  |  Funcs: 98.43%  |  Lines: 96.82%
```

All layers at 100% except:

- `src/lib/prisma.ts` — 0% (infrastructure singleton, always mocked)
- `src/app.ts` — 75% branch (one branch for pino-pretty transport condition)

## Verification

```bash
yarn test              # 150 unit tests pass (22 files)
yarn test:coverage     # 96.85% stmts, 87.27% branch
yarn test:integration  # 66 integration tests pass (7 files)
```

## Files created

| File                                                     | Tests | Purpose                                      |
| -------------------------------------------------------- | ----- | -------------------------------------------- |
| `tests/unit/routes/health.route.test.ts`                 | 1     | Health endpoint                              |
| `tests/unit/routes/funds.route.test.ts`                  | 5     | All 5 fund endpoints                         |
| `tests/unit/routes/investors.route.test.ts`              | 2     | Investor endpoints                           |
| `tests/unit/routes/investments.route.test.ts`            | 2     | Investment endpoints                         |
| `tests/unit/routes/transactions.route.test.ts`           | 3     | Transaction endpoints                        |
| `tests/unit/routes/admin.route.test.ts`                  | 1     | Admin endpoint                               |
| `tests/unit/app.test.ts`                                 | 2     | App factory bootstrap                        |
| `tests/unit/repositories/fund.repository.test.ts`        | 4     | Fund repo Prisma calls                       |
| `tests/unit/repositories/investor.repository.test.ts`    | 2     | Investor repo Prisma calls                   |
| `tests/unit/repositories/investment.repository.test.ts`  | 2     | Investment repo + Date conversion            |
| `tests/unit/repositories/transaction.repository.test.ts` | 7     | Transaction repo including aggregate + batch |
