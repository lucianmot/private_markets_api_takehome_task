import {
  CreateInvestmentSchema,
  InvestmentParamsSchema,
} from "../../../src/schemas/investment.schema.js";

describe("CreateInvestmentSchema", () => {
  const valid = {
    investor_id: "550e8400-e29b-41d4-a716-446655440000",
    amount_usd: 500000,
    investment_date: "2024-06-15",
  };

  it("accepts a valid investment", () => {
    expect(CreateInvestmentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid investor_id (not UUID)", () => {
    expect(
      CreateInvestmentSchema.safeParse({ ...valid, investor_id: "bad" })
        .success,
    ).toBe(false);
  });

  it("rejects missing investor_id", () => {
    const { amount_usd, investment_date } = valid;
    expect(
      CreateInvestmentSchema.safeParse({ amount_usd, investment_date }).success,
    ).toBe(false);
  });

  it("rejects zero amount_usd", () => {
    expect(
      CreateInvestmentSchema.safeParse({ ...valid, amount_usd: 0 }).success,
    ).toBe(false);
  });

  it("rejects negative amount_usd", () => {
    expect(
      CreateInvestmentSchema.safeParse({ ...valid, amount_usd: -100 }).success,
    ).toBe(false);
  });

  it("rejects invalid date format", () => {
    expect(
      CreateInvestmentSchema.safeParse({
        ...valid,
        investment_date: "15/06/2024",
      }).success,
    ).toBe(false);
  });

  it("rejects partial date format", () => {
    expect(
      CreateInvestmentSchema.safeParse({
        ...valid,
        investment_date: "2024-6-15",
      }).success,
    ).toBe(false);
  });
});

describe("InvestmentParamsSchema", () => {
  it("accepts a valid UUID", () => {
    expect(
      InvestmentParamsSchema.safeParse({
        fund_id: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    expect(
      InvestmentParamsSchema.safeParse({ fund_id: "not-a-uuid" }).success,
    ).toBe(false);
  });
});
