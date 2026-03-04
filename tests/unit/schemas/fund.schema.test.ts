import {
  CreateFundSchema,
  UpdateFundSchema,
  FundParamsSchema,
} from "../../../src/schemas/fund.schema.js";

describe("CreateFundSchema", () => {
  const valid = {
    name: "Test Fund",
    vintage_year: 2024,
    target_size_usd: 1000000,
    status: "Fundraising",
  };

  it("accepts a valid fund", () => {
    expect(CreateFundSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing name", () => {
    const { vintage_year, target_size_usd, status } = valid;
    expect(
      CreateFundSchema.safeParse({ vintage_year, target_size_usd, status })
        .success,
    ).toBe(false);
  });

  it("rejects empty name", () => {
    expect(CreateFundSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects missing vintage_year", () => {
    const { name, target_size_usd, status } = valid;
    expect(
      CreateFundSchema.safeParse({ name, target_size_usd, status }).success,
    ).toBe(false);
  });

  it("rejects non-integer vintage_year", () => {
    expect(
      CreateFundSchema.safeParse({ ...valid, vintage_year: 2024.5 }).success,
    ).toBe(false);
  });

  it("rejects vintage_year below 1900", () => {
    expect(
      CreateFundSchema.safeParse({ ...valid, vintage_year: 1899 }).success,
    ).toBe(false);
  });

  it("rejects vintage_year above 2100", () => {
    expect(
      CreateFundSchema.safeParse({ ...valid, vintage_year: 2101 }).success,
    ).toBe(false);
  });

  it("rejects missing target_size_usd", () => {
    const { name, vintage_year, status } = valid;
    expect(
      CreateFundSchema.safeParse({ name, vintage_year, status }).success,
    ).toBe(false);
  });

  it("rejects zero target_size_usd", () => {
    expect(
      CreateFundSchema.safeParse({ ...valid, target_size_usd: 0 }).success,
    ).toBe(false);
  });

  it("rejects negative target_size_usd", () => {
    expect(
      CreateFundSchema.safeParse({ ...valid, target_size_usd: -100 }).success,
    ).toBe(false);
  });

  it("rejects missing status", () => {
    const { name, vintage_year, target_size_usd } = valid;
    expect(
      CreateFundSchema.safeParse({ name, vintage_year, target_size_usd })
        .success,
    ).toBe(false);
  });

  it("rejects invalid status enum", () => {
    expect(
      CreateFundSchema.safeParse({ ...valid, status: "Invalid" }).success,
    ).toBe(false);
  });

  it("accepts all valid status values", () => {
    for (const status of ["Fundraising", "Investing", "Closed"]) {
      expect(CreateFundSchema.safeParse({ ...valid, status }).success).toBe(
        true,
      );
    }
  });
});

describe("UpdateFundSchema", () => {
  it("accepts partial update with name only", () => {
    expect(UpdateFundSchema.safeParse({ name: "Updated" }).success).toBe(true);
  });

  it("accepts partial update with status only", () => {
    expect(UpdateFundSchema.safeParse({ status: "Closed" }).success).toBe(true);
  });

  it("rejects invalid values in partial update", () => {
    expect(UpdateFundSchema.safeParse({ vintage_year: 1899 }).success).toBe(
      false,
    );
  });
});

describe("FundParamsSchema", () => {
  it("accepts a valid UUID", () => {
    expect(
      FundParamsSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    expect(FundParamsSchema.safeParse({ id: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("rejects missing id", () => {
    expect(FundParamsSchema.safeParse({}).success).toBe(false);
  });
});
