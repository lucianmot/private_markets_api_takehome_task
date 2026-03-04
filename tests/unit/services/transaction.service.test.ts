vi.mock("../../../src/repositories/transaction.repository.js", () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findByFundIdAndStatus: vi.fn(),
  sumAmountByFundIdAndStatus: vi.fn(),
  updateManyFeesByFundId: vi.fn(),
}));

vi.mock("../../../src/services/fund.service.js", () => ({
  getFundById: vi.fn(),
}));

import * as txnRepo from "../../../src/repositories/transaction.repository.js";
import { getFundById } from "../../../src/services/fund.service.js";
import {
  getAllTransactions,
  processTransaction,
  reverseTransaction,
  getFundTotalValue,
  recalculateFees,
} from "../../../src/services/transaction.service.js";

function mockTxn(overrides?: Record<string, unknown>) {
  return {
    transaction_id: "txn-1",
    fund_id: "fund-1",
    amount: "100000",
    fee_percentage: "2.5",
    calculated_fees: "2500",
    auto_calculate_fees: true,
    bypass_validation: false,
    status: "completed",
    reason: null,
    reversed_at: null,
    created_at: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("transaction.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFundById).mockResolvedValue({} as never);
  });

  describe("getAllTransactions", () => {
    it("returns serialised transactions", async () => {
      vi.mocked(txnRepo.findAll).mockResolvedValue([mockTxn()] as never);

      const result = await getAllTransactions();

      expect(result[0].amount).toBe(100000);
      expect(result[0].fee_percentage).toBe(2.5);
      expect(result[0].calculated_fees).toBe(2500);
      expect(typeof result[0].amount).toBe("number");
    });

    it("serialises null calculated_fees", async () => {
      vi.mocked(txnRepo.findAll).mockResolvedValue([
        mockTxn({ calculated_fees: null }),
      ] as never);

      const result = await getAllTransactions();
      expect(result[0].calculated_fees).toBeNull();
    });
  });

  describe("processTransaction", () => {
    const input = {
      fund_id: "fund-1",
      amount: 100000,
      fee_percentage: 2.5,
      auto_calculate_fees: true,
      bypass_validation: false,
    };

    it("auto-calculates fees and creates transaction", async () => {
      vi.mocked(txnRepo.create).mockResolvedValue(
        mockTxn({ calculated_fees: "2500" }) as never,
      );

      const result = await processTransaction(input);

      expect(getFundById).toHaveBeenCalledWith("fund-1");
      expect(vi.mocked(txnRepo.create).mock.calls[0][0].calculated_fees).toBe(
        2500,
      );
      expect(result.calculated_fees).toBe(2500);
    });

    it("sets null fees when bypass_validation is true", async () => {
      vi.mocked(txnRepo.create).mockResolvedValue(
        mockTxn({ calculated_fees: null }) as never,
      );

      await processTransaction({ ...input, bypass_validation: true });

      expect(
        vi.mocked(txnRepo.create).mock.calls[0][0].calculated_fees,
      ).toBeNull();
    });

    it("sets null fees when auto_calculate_fees is false", async () => {
      vi.mocked(txnRepo.create).mockResolvedValue(
        mockTxn({ calculated_fees: null }) as never,
      );

      await processTransaction({ ...input, auto_calculate_fees: false });

      expect(
        vi.mocked(txnRepo.create).mock.calls[0][0].calculated_fees,
      ).toBeNull();
    });

    it("throws when fund not found", async () => {
      vi.mocked(getFundById).mockRejectedValue(new Error("Fund not found"));

      await expect(processTransaction(input)).rejects.toThrow("Fund not found");
      expect(txnRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("reverseTransaction", () => {
    it("reverses a completed transaction", async () => {
      vi.mocked(txnRepo.findById).mockResolvedValue(mockTxn() as never);
      vi.mocked(txnRepo.update).mockResolvedValue(
        mockTxn({ status: "reversed", reason: "test" }) as never,
      );

      const result = await reverseTransaction("txn-1", "test", false);

      expect(txnRepo.update).toHaveBeenCalled();
      expect(result.amount).toBe(100000);
    });

    it("throws NotFoundError when transaction not found", async () => {
      vi.mocked(txnRepo.findById).mockResolvedValue(null as never);

      await expect(
        reverseTransaction("missing", "reason", false),
      ).rejects.toThrow("Transaction");
    });

    it("throws ConflictError when already reversed", async () => {
      vi.mocked(txnRepo.findById).mockResolvedValue(
        mockTxn({ status: "reversed" }) as never,
      );

      await expect(
        reverseTransaction("txn-1", "reason", false),
      ).rejects.toThrow("already reversed");
    });

    it("nullifies fees when refundFees is true", async () => {
      vi.mocked(txnRepo.findById).mockResolvedValue(mockTxn() as never);
      vi.mocked(txnRepo.update).mockResolvedValue(
        mockTxn({ calculated_fees: null }) as never,
      );

      await reverseTransaction("txn-1", "refund", true);

      const updateArg = vi.mocked(txnRepo.update).mock.calls[0][1];
      expect(updateArg.calculated_fees).toBeNull();
    });

    it("does not nullify fees when refundFees is false", async () => {
      vi.mocked(txnRepo.findById).mockResolvedValue(mockTxn() as never);
      vi.mocked(txnRepo.update).mockResolvedValue(mockTxn() as never);

      await reverseTransaction("txn-1", "no refund", false);

      const updateArg = vi.mocked(txnRepo.update).mock.calls[0][1];
      expect(updateArg.calculated_fees).toBeUndefined();
    });
  });

  describe("getFundTotalValue", () => {
    it("returns completed totals only", async () => {
      vi.mocked(txnRepo.sumAmountByFundIdAndStatus).mockResolvedValue({
        sum: "500000",
        count: 3,
      } as never);

      const result = await getFundTotalValue("fund-1", false);

      expect(result.total_value).toBe(500000);
      expect(result.completed_count).toBe(3);
      expect(result.pending_count).toBeUndefined();
    });

    it("includes pending when requested", async () => {
      vi.mocked(txnRepo.sumAmountByFundIdAndStatus)
        .mockResolvedValueOnce({ sum: "500000", count: 3 } as never)
        .mockResolvedValueOnce({ sum: "100000", count: 1 } as never);

      const result = await getFundTotalValue("fund-1", true);

      expect(result.total_value).toBe(500000);
      expect(result.pending_value).toBe(100000);
      expect(result.pending_count).toBe(1);
    });

    it("returns 0 when no transactions", async () => {
      vi.mocked(txnRepo.sumAmountByFundIdAndStatus).mockResolvedValue({
        sum: null,
        count: 0,
      } as never);

      const result = await getFundTotalValue("fund-1", false);

      expect(result.total_value).toBe(0);
      expect(result.completed_count).toBe(0);
    });

    it("throws when fund not found", async () => {
      vi.mocked(getFundById).mockRejectedValue(new Error("Fund not found"));

      await expect(getFundTotalValue("missing", false)).rejects.toThrow(
        "Fund not found",
      );
    });
  });

  describe("recalculateFees", () => {
    it("recalculates retroactively", async () => {
      const txns = [mockTxn({ transaction_id: "t1", amount: "100000" })];
      vi.mocked(txnRepo.findByFundIdAndStatus).mockResolvedValue(txns as never);
      vi.mocked(txnRepo.updateManyFeesByFundId).mockResolvedValue([
        mockTxn({ fee_percentage: "3", calculated_fees: "3000" }),
      ] as never);

      const result = await recalculateFees("fund-1", 3, true);

      expect(result.updated_count).toBe(1);
      expect(result.new_fee_percentage).toBe(3);
      expect(result.transactions).toHaveLength(1);
    });

    it("returns empty when not retroactive", async () => {
      const result = await recalculateFees("fund-1", 3, false);

      expect(result.updated_count).toBe(0);
      expect(result.transactions).toEqual([]);
    });

    it("throws when fund not found", async () => {
      vi.mocked(getFundById).mockRejectedValue(new Error("Fund not found"));

      await expect(recalculateFees("missing", 3, true)).rejects.toThrow(
        "Fund not found",
      );
    });

    it("handles no completed transactions", async () => {
      vi.mocked(txnRepo.findByFundIdAndStatus).mockResolvedValue([] as never);
      vi.mocked(txnRepo.updateManyFeesByFundId).mockResolvedValue([] as never);

      const result = await recalculateFees("fund-1", 5, true);

      expect(result.updated_count).toBe(0);
      expect(result.transactions).toEqual([]);
    });
  });
});
