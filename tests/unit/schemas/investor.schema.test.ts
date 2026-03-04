import { CreateInvestorSchema } from "../../../src/schemas/investor.schema.js";

describe("CreateInvestorSchema", () => {
  const valid = {
    name: "Test Investor",
    investor_type: "Individual",
    email: "test@example.com",
  };

  it("accepts a valid investor", () => {
    expect(CreateInvestorSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(CreateInvestorSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects invalid investor_type", () => {
    expect(
      CreateInvestorSchema.safeParse({ ...valid, investor_type: "Unknown" })
        .success,
    ).toBe(false);
  });

  it("accepts all valid investor_type values", () => {
    for (const investor_type of ["Individual", "Institution", "FamilyOffice"]) {
      expect(
        CreateInvestorSchema.safeParse({ ...valid, investor_type }).success,
      ).toBe(true);
    }
  });

  it("rejects invalid email", () => {
    expect(
      CreateInvestorSchema.safeParse({ ...valid, email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("rejects missing email", () => {
    const { name, investor_type } = valid;
    expect(
      CreateInvestorSchema.safeParse({ name, investor_type }).success,
    ).toBe(false);
  });
});
