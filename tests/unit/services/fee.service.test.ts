import {
  calculateFees,
  shouldAutoCalculate,
} from "../../../src/services/fee.service.js";

describe("calculateFees", () => {
  it("calculates basic fee", () => {
    expect(calculateFees(100000, 2.5)).toBe(2500);
  });

  it("returns 0 for zero fee percentage", () => {
    expect(calculateFees(100000, 0)).toBe(0);
  });

  it("returns 0 for zero amount", () => {
    expect(calculateFees(0, 5)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculateFees(100, 3.333)).toBe(3.33);
  });

  it("handles large numbers", () => {
    expect(calculateFees(1000000000, 0.01)).toBe(100000);
  });

  it("handles fractional percentages", () => {
    expect(calculateFees(999999, 3.75)).toBe(37499.96);
  });
});

describe("shouldAutoCalculate", () => {
  it("returns true when auto=true and bypass=false", () => {
    expect(shouldAutoCalculate(true, false)).toBe(true);
  });

  it("returns false when bypass=true", () => {
    expect(shouldAutoCalculate(true, true)).toBe(false);
  });

  it("returns false when auto=false", () => {
    expect(shouldAutoCalculate(false, false)).toBe(false);
  });

  it("returns false when both false", () => {
    expect(shouldAutoCalculate(false, false)).toBe(false);
  });

  it("returns false when both true", () => {
    expect(shouldAutoCalculate(true, true)).toBe(false);
  });
});
