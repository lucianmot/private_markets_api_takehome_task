import { mockInvestor } from "../../helpers/fixtures.js";

vi.mock("../../../src/repositories/investor.repository.js", () => ({
  findAll: vi.fn(),
  create: vi.fn(),
}));

import * as investorRepo from "../../../src/repositories/investor.repository.js";
import {
  getAllInvestors,
  createInvestor,
} from "../../../src/services/investor.service.js";

describe("investor.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllInvestors", () => {
    it("returns all investors from repository", async () => {
      const investors = [mockInvestor(), mockInvestor({ name: "Second" })];
      vi.mocked(investorRepo.findAll).mockResolvedValue(investors as never);

      const result = await getAllInvestors();

      expect(investorRepo.findAll).toHaveBeenCalledOnce();
      expect(result).toHaveLength(2);
    });
  });

  describe("createInvestor", () => {
    it("creates and returns investor", async () => {
      const input = {
        name: "New Investor",
        investor_type: "Institution" as const,
        email: "new@example.com",
      };
      const created = mockInvestor(input);
      vi.mocked(investorRepo.create).mockResolvedValue(created as never);

      const result = await createInvestor(input);

      expect(investorRepo.create).toHaveBeenCalledWith(input);
      expect(result.name).toBe("New Investor");
    });
  });
});
