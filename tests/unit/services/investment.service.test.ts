import { mockInvestment } from "../../helpers/fixtures.js";

vi.mock("../../../src/repositories/investment.repository.js", () => ({
  findByFundId: vi.fn(),
  create: vi.fn(),
}));

vi.mock("../../../src/services/fund.service.js", () => ({
  getFundById: vi.fn(),
}));

import * as investmentRepo from "../../../src/repositories/investment.repository.js";
import { getFundById } from "../../../src/services/fund.service.js";
import {
  getInvestmentsByFundId,
  createInvestment,
} from "../../../src/services/investment.service.js";

describe("investment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFundById).mockResolvedValue({} as never);
  });

  describe("getInvestmentsByFundId", () => {
    it("verifies fund exists and returns serialised investments", async () => {
      const raw = [
        mockInvestment({
          amount_usd: "500000",
          investment_date: new Date("2024-06-15"),
        }),
      ];
      vi.mocked(investmentRepo.findByFundId).mockResolvedValue(raw as never);

      const result = await getInvestmentsByFundId("fund-id");

      expect(getFundById).toHaveBeenCalledWith("fund-id");
      expect(investmentRepo.findByFundId).toHaveBeenCalledWith("fund-id");
      expect(result[0].amount_usd).toBe(500000);
      expect(typeof result[0].amount_usd).toBe("number");
      expect(result[0].investment_date).toBe("2024-06-15");
      expect(typeof result[0].investment_date).toBe("string");
    });

    it("throws when fund does not exist", async () => {
      vi.mocked(getFundById).mockRejectedValue(new Error("Fund not found"));

      await expect(getInvestmentsByFundId("missing")).rejects.toThrow(
        "Fund not found",
      );
      expect(investmentRepo.findByFundId).not.toHaveBeenCalled();
    });
  });

  describe("createInvestment", () => {
    it("verifies fund exists, creates, and returns serialised investment", async () => {
      const input = {
        investor_id: "inv-id",
        amount_usd: 250000,
        investment_date: "2024-03-20",
      };
      const raw = mockInvestment({
        amount_usd: "250000",
        investment_date: new Date("2024-03-20"),
      });
      vi.mocked(investmentRepo.create).mockResolvedValue(raw as never);

      const result = await createInvestment("fund-id", input);

      expect(getFundById).toHaveBeenCalledWith("fund-id");
      expect(investmentRepo.create).toHaveBeenCalledWith("fund-id", input);
      expect(result.amount_usd).toBe(250000);
      expect(result.investment_date).toBe("2024-03-20");
    });

    it("throws when fund does not exist", async () => {
      vi.mocked(getFundById).mockRejectedValue(new Error("Fund not found"));

      await expect(
        createInvestment("missing", {
          investor_id: "inv-id",
          amount_usd: 100,
          investment_date: "2024-01-01",
        }),
      ).rejects.toThrow("Fund not found");
      expect(investmentRepo.create).not.toHaveBeenCalled();
    });

    it("serialises Decimal amount_usd to number", async () => {
      const raw = mockInvestment({
        amount_usd: "999999.99",
        investment_date: new Date("2024-01-01"),
      });
      vi.mocked(investmentRepo.create).mockResolvedValue(raw as never);

      const result = await createInvestment("fund-id", {
        investor_id: "inv-id",
        amount_usd: 999999.99,
        investment_date: "2024-01-01",
      });

      expect(result.amount_usd).toBe(999999.99);
    });
  });
});
