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
      enabled: true,
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
