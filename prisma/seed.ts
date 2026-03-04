import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/funds_db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const horizon = await prisma.fund.create({
    data: {
      name: "Horizon Growth Equity",
      vintage_year: 2023,
      target_size_usd: 500000000,
      status: "Fundraising",
    },
  });

  const apex = await prisma.fund.create({
    data: {
      name: "Apex Venture Capital",
      vintage_year: 2022,
      target_size_usd: 250000000,
      status: "Investing",
    },
  });

  const summit = await prisma.fund.create({
    data: {
      name: "Summit Buyout",
      vintage_year: 2021,
      target_size_usd: 1000000000,
      status: "Closed",
    },
  });

  await prisma.fund.create({
    data: {
      name: "Nova Infrastructure",
      vintage_year: 2024,
      target_size_usd: 750000000,
      status: "Fundraising",
    },
  });

  const alice = await prisma.investor.create({
    data: {
      name: "Alice Chen",
      investor_type: "Individual",
      email: "alice.chen@example.com",
    },
  });

  const globalPension = await prisma.investor.create({
    data: {
      name: "Global Pension Partners",
      investor_type: "Institution",
      email: "investments@globalpension.com",
    },
  });

  const morrison = await prisma.investor.create({
    data: {
      name: "Morrison Family Office",
      investor_type: "FamilyOffice",
      email: "office@morrisonfamily.com",
    },
  });

  const bob = await prisma.investor.create({
    data: {
      name: "Bob Williams",
      investor_type: "Individual",
      email: "bob.williams@example.com",
    },
  });

  await prisma.investor.create({
    data: {
      name: "BlueStar Capital",
      investor_type: "Institution",
      email: "allocations@bluestarcapital.com",
    },
  });

  await prisma.investment.createMany({
    data: [
      {
        fund_id: horizon.id,
        investor_id: alice.id,
        amount_usd: 10000000,
        investment_date: new Date("2023-03-15"),
      },
      {
        fund_id: horizon.id,
        investor_id: globalPension.id,
        amount_usd: 50000000,
        investment_date: new Date("2023-04-01"),
      },
      {
        fund_id: apex.id,
        investor_id: morrison.id,
        amount_usd: 25000000,
        investment_date: new Date("2022-06-20"),
      },
      {
        fund_id: apex.id,
        investor_id: bob.id,
        amount_usd: 15000000,
        investment_date: new Date("2022-07-10"),
      },
      {
        fund_id: summit.id,
        investor_id: globalPension.id,
        amount_usd: 100000000,
        investment_date: new Date("2021-01-15"),
      },
      {
        fund_id: summit.id,
        investor_id: alice.id,
        amount_usd: 30000000,
        investment_date: new Date("2021-02-28"),
      },
    ],
  });

  console.log("Seeded: 4 funds, 5 investors, 6 investments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
