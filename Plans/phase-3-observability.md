# Phase 3 — Observability

## Goal

Add OpenTelemetry tracing and Sentry error tracking. Both gracefully degrade when env vars are not set.

## Prerequisites

- Phase 2 complete (error handler exists to integrate Sentry capture)

## Steps

### 3.1 — Instrumentation file (`src/instrumentation.ts`)

This file must be loaded via `--import` flag before the app starts (both dev and production):

```
dev:   tsx watch --import ./src/instrumentation.ts src/server.ts
start: node --import ./dist/instrumentation.js dist/server.js
```

Implementation:

```ts
import * as Sentry from "@sentry/node";
import { SentrySpanProcessor, SentryPropagator } from "@sentry/opentelemetry";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
```

Key behaviour:

1. **Sentry init** (if `SENTRY_DSN` is set) — with `skipOpenTelemetrySetup: true` so Sentry doesn't create its own OTel provider
2. **NodeTracerProvider** — custom provider with:
   - `SentrySpanProcessor` (always, for Sentry trace integration)
   - `BatchSpanProcessor` with `OTLPTraceExporter` (only if `OTEL_EXPORTER_OTLP_ENDPOINT` is set)
   - `SentryPropagator` for distributed tracing context propagation
3. **Auto-instrumentations** — HTTP, PostgreSQL, etc. registered; FS instrumentation disabled
4. **Graceful degradation** — if no env vars set, OTel and Sentry silently skip

### 3.2 — Sentry integration in error handler

In `src/lib/error-handler.ts`, the 500 fallback branch calls:

```ts
import * as Sentry from "@sentry/node";

// In the catch-all branch:
Sentry.captureException(error);
```

This sends unhandled errors to Sentry while still returning a generic 500 to the client.

### 3.3 — Build config

`tsup.config.ts` has two entry points to ensure instrumentation is bundled separately:

```ts
entry: ["src/server.ts", "src/instrumentation.ts"];
```

### 3.4 — Coverage exclusion

`src/instrumentation.ts` is excluded from both vitest coverage configs because it's infrastructure code that requires real OTel/Sentry SDKs to test meaningfully.

## Environment variables

| Variable                      | Required | Purpose                               |
| ----------------------------- | -------- | ------------------------------------- |
| `SENTRY_DSN`                  | No       | Sentry project DSN for error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No       | OTLP endpoint for trace export        |

## Verification

```bash
yarn dev
# No errors even without SENTRY_DSN or OTEL_EXPORTER_OTLP_ENDPOINT
# Server starts normally with graceful degradation
```

## Files created/modified

| File                       | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `src/instrumentation.ts`   | OTel + Sentry setup, loaded via --import           |
| `src/lib/error-handler.ts` | Modified: added Sentry.captureException for 500s   |
| `tsup.config.ts`           | Modified: instrumentation.ts as second entry point |
