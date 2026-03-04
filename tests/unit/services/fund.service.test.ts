import { mockFund } from "../../helpers/fixtures.js";

vi.mock("../../../src/repositories/fund.repository.js", () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

import * as fundRepo from "../../../src/repositories/fund.repository.js";
import {
  getAllFunds,
  getFundById,
  createFund,
  updateFund,
} from "../../../src/services/fund.service.js";

describe("fund.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllFunds", () => {
    it("returns serialised funds with Decimal converted to number", async () => {
      const raw = [mockFund({ target_size_usd: "5000000" })];
      vi.mocked(fundRepo.findAll).mockResolvedValue(raw as never);

      const result = await getAllFunds();

      expect(fundRepo.findAll).toHaveBeenCalledOnce();
      expect(result[0].target_size_usd).toBe(5000000);
      expect(typeof result[0].target_size_usd).toBe("number");
    });
  });

  describe("getFundById", () => {
    it("returns serialised fund when found", async () => {
      const raw = mockFund({ target_size_usd: "2000000" });
      vi.mocked(fundRepo.findById).mockResolvedValue(raw as never);

      const result = await getFundById(raw.id);

      expect(fundRepo.findById).toHaveBeenCalledWith(raw.id);
      expect(result.target_size_usd).toBe(2000000);
    });

    it("throws NotFoundError when fund does not exist", async () => {
      vi.mocked(fundRepo.findById).mockResolvedValue(null as never);

      await expect(getFundById("missing-id")).rejects.toThrow("Fund");
    });
  });

  describe("createFund", () => {
    it("creates and returns serialised fund", async () => {
      const input = {
        name: "New Fund",
        vintage_year: 2024,
        target_size_usd: 1000000,
        status: "Fundraising" as const,
      };
      const raw = mockFund({ ...input, target_size_usd: "1000000" });
      vi.mocked(fundRepo.create).mockResolvedValue(raw as never);

      const result = await createFund(input);

      expect(fundRepo.create).toHaveBeenCalledWith(input);
      expect(result.target_size_usd).toBe(1000000);
    });
  });

  describe("updateFund", () => {
    it("updates and returns serialised fund", async () => {
      const raw = mockFund({
        name: "Updated",
        target_size_usd: "3000000",
      });
      vi.mocked(fundRepo.update).mockResolvedValue(raw as never);

      const result = await updateFund(raw.id, { name: "Updated" });

      expect(fundRepo.update).toHaveBeenCalledWith(raw.id, {
        name: "Updated",
      });
      expect(result.target_size_usd).toBe(3000000);
    });
  });
});
