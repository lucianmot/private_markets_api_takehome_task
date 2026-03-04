import { execSync } from "child_process";

export default function globalSetup() {
  execSync("npx prisma db push --accept-data-loss", {
    env: {
      ...process.env,
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5433/funds_test_db",
    },
  });
}
