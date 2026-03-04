import { randomUUID } from "crypto";

// --- Mock data factories (for unit tests) ---

export function mockFund(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    name: "Test Fund",
    vintage_year: 2024,
    target_size_usd: "1000000",
    status: "Fundraising",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

export function mockInvestor(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    name: "Test Investor",
    investor_type: "Individual",
    email: "test@example.com",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

export function mockInvestment(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    fund_id: randomUUID(),
    investor_id: randomUUID(),
    amount_usd: "1000000",
    investment_date: new Date("2024-01-01"),
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

export function mockTransaction(overrides?: Record<string, unknown>) {
  return {
    transaction_id: randomUUID(),
    fund_id: randomUUID(),
    amount: "100000",
    fee_percentage: "2.5",
    fee_amount: "2500",
    status: "completed",
    type: "capital_call",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    ...overrides,
  };
}

// --- Request body templates (for integration tests) ---

export const validCreateFund = {
  name: "Integration Test Fund",
  vintage_year: 2024,
  target_size_usd: 1000000,
  status: "Fundraising",
};

export const validCreateInvestor = {
  name: "Integration Test Investor",
  investor_type: "Individual" as const,
  email: "integration@example.com",
};

export const validCreateInvestment = {
  investor_id: "",
  amount_usd: 500000,
  investment_date: "2024-06-15",
};

export const validProcessTransaction = {
  fund_id: "",
  amount: 100000,
  fee_percentage: 2.5,
};

export const validReverseTransaction = {
  reason: "Test reversal",
  refund_fees: true,
};

export const validRecalculateFees = {
  fund_id: "",
  new_fee_percentage: 3.0,
  apply_retroactively: false,
};
