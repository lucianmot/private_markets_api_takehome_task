import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrate: {
    async seed() {
      await import("./prisma/seed.js");
    },
  },
});
