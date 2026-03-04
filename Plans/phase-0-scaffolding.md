# Phase 0 — Project Scaffolding

## Goal

Set up the project foundation: Node.js + TypeScript tooling, dependencies, build pipeline, test framework, and linting/formatting.

## Prerequisites

- Node.js >= 20.0.0
- Yarn 4.12.0 (Corepack)

## Steps

### 0.1 — Initialise the project

```bash
mkdir practice_rest_api_001 && cd practice_rest_api_001
corepack enable && yarn init -2
```

Set in `package.json`:

```json
{
  "name": "titanbay-funds-api",
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=20.0.0" },
  "packageManager": "yarn@4.12.0"
}
```

### 0.2 — Install production dependencies

```bash
yarn add fastify@^5.7.4 \
  fastify-type-provider-zod@^6.1.0 \
  zod@^4.3.6 \
  @fastify/cors@^11.2.0 \
  @prisma/client@^7.4.1 \
  @prisma/adapter-pg@^7.4.2 \
  dotenv@^17.3.1 \
  pino-pretty@^13.1.3 \
  @sentry/node@^10.40.0 \
  @sentry/opentelemetry@^10.40.0 \
  @opentelemetry/sdk-node@^0.212.0 \
  @opentelemetry/exporter-trace-otlp-http@^0.212.0 \
  @opentelemetry/auto-instrumentations-node@^0.70.1
```

### 0.3 — Install dev dependencies

```bash
yarn add -D typescript@^5.9.3 \
  @types/node@^25.3.0 \
  tsup@^8.5.1 \
  tsx@^4.21.0 \
  vitest@^4.0.18 \
  @vitest/coverage-v8@4.0.18 \
  eslint@^10.0.2 \
  @eslint/js@^10.0.1 \
  typescript-eslint@^8.56.1 \
  eslint-config-prettier@^10.1.8 \
  prettier@^3.8.1 \
  prisma@^7.4.1
```

### 0.4 — TypeScript config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "declaration": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 0.5 — Build config (`tsup.config.ts`)

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/instrumentation.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
});
```

### 0.6 — Test configs

**`vitest.config.ts`** (unit tests):

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/server.ts",
        "src/instrumentation.ts",
        "src/plugins/**",
        "src/generated/**",
      ],
    },
  },
});
```

**`vitest.integration.config.ts`** (integration tests):

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globals: true,
    passWithNoTests: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: "forks",
    maxWorkers: 1,
    globalSetup: "./tests/global-setup.integration.ts",
    env: {
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5433/funds_test_db",
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/server.ts",
        "src/instrumentation.ts",
        "src/plugins/**",
        "src/generated/**",
      ],
    },
  },
});
```

### 0.7 — NPM scripts

```json
{
  "scripts": {
    "dev": "tsx watch --import ./src/instrumentation.ts src/server.ts",
    "build": "tsup",
    "start": "node --import ./dist/instrumentation.js dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:coverage": "vitest run --coverage",
    "test:integration:coverage": "vitest run --config vitest.integration.config.ts --coverage",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### 0.8 — Create stub entry files

```
src/server.ts      — placeholder: console.log("server")
src/app.ts         — placeholder: export async function buildApp() {}
src/instrumentation.ts — placeholder: empty
```

### 0.9 — Create directory structure

```
src/
├── lib/
├── routes/
├── repositories/
├── services/
├── schemas/
tests/
├── unit/
├── integration/
├── helpers/
prisma/
plans/
```

## Verification

```bash
yarn build        # produces dist/server.js + dist/instrumentation.js
yarn test         # passes with no tests (passWithNoTests: true)
yarn lint         # no errors
```

## Files created

| File                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `package.json`                 | Project manifest, scripts, dependencies      |
| `tsconfig.json`                | TypeScript compiler options                  |
| `tsup.config.ts`               | Build pipeline (ESM, node20, 2 entry points) |
| `vitest.config.ts`             | Unit test config with v8 coverage            |
| `vitest.integration.config.ts` | Integration test config with forks pool      |
| `src/server.ts`                | Entry point stub                             |
| `src/app.ts`                   | App factory stub                             |
| `src/instrumentation.ts`       | OTel/Sentry stub                             |
