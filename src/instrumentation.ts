import * as Sentry from "@sentry/node";
import { SentrySpanProcessor, SentryPropagator } from "@sentry/opentelemetry";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

const sentryDsn = process.env.SENTRY_DSN;
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    skipOpenTelemetrySetup: true,
  });
}

const provider = new NodeTracerProvider({
  spanProcessors: [
    new SentrySpanProcessor(),
    ...(otlpEndpoint
      ? [new BatchSpanProcessor(new OTLPTraceExporter({ url: otlpEndpoint }))]
      : []),
  ],
});

provider.register({
  propagator: new SentryPropagator(),
});

registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});
