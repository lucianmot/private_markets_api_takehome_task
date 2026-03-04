import * as txnRepo from "../repositories/transaction.repository.js";
import { getFundById } from "./fund.service.js";
import { calculateFees, shouldAutoCalculate } from "./fee.service.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";
import type { ProcessTransactionInput } from "../schemas/transaction.schema.js";

function serialize(txn: {
  amount: unknown;
  fee_percentage: unknown;
  calculated_fees: unknown;
  [key: string]: unknown;
}) {
  return {
    ...txn,
    amount: Number(txn.amount),
    fee_percentage: Number(txn.fee_percentage),
    calculated_fees:
      txn.calculated_fees != null ? Number(txn.calculated_fees) : null,
  };
}

export async function getAllTransactions() {
  const txns = await txnRepo.findAll();
  return txns.map(serialize);
}

export async function processTransaction(data: ProcessTransactionInput) {
  await getFundById(data.fund_id);

  const fees = shouldAutoCalculate(
    data.auto_calculate_fees,
    data.bypass_validation,
  )
    ? calculateFees(data.amount, data.fee_percentage)
    : null;

  const txn = await txnRepo.create({
    fund_id: data.fund_id,
    amount: data.amount,
    fee_percentage: data.fee_percentage,
    calculated_fees: fees,
    auto_calculate_fees: data.auto_calculate_fees,
    bypass_validation: data.bypass_validation,
    status: "completed",
  });

  return serialize(txn);
}

export async function reverseTransaction(
  transactionId: string,
  reason: string,
  refundFees: boolean,
) {
  const txn = await txnRepo.findById(transactionId);
  if (!txn) throw new NotFoundError("Transaction", transactionId);
  if (txn.status === "reversed") {
    throw new ConflictError("Transaction is already reversed");
  }

  const updateData: {
    status: "reversed";
    reason: string;
    reversed_at: Date;
    calculated_fees?: null;
  } = {
    status: "reversed",
    reason,
    reversed_at: new Date(),
  };

  if (refundFees) {
    updateData.calculated_fees = null;
  }

  const updated = await txnRepo.update(transactionId, updateData);
  return serialize(updated);
}

export async function getFundTotalValue(
  fundId: string,
  includePending: boolean,
) {
  await getFundById(fundId);

  const completed = await txnRepo.sumAmountByFundIdAndStatus(
    fundId,
    "completed",
  );

  const result: {
    fund_id: string;
    total_value: number;
    completed_count: number;
    pending_count?: number;
    pending_value?: number;
  } = {
    fund_id: fundId,
    total_value: Number(completed.sum ?? 0),
    completed_count: completed.count,
  };

  if (includePending) {
    const pending = await txnRepo.sumAmountByFundIdAndStatus(fundId, "pending");
    result.pending_count = pending.count;
    result.pending_value = Number(pending.sum ?? 0);
  }

  return result;
}

export async function recalculateFees(
  fundId: string,
  newFeePercentage: number,
  applyRetroactively: boolean,
) {
  await getFundById(fundId);

  const txns = await txnRepo.findByFundIdAndStatus(fundId, "completed");

  if (!applyRetroactively) {
    return {
      updated_count: 0,
      new_fee_percentage: newFeePercentage,
      transactions: [],
    };
  }

  const updates = txns.map((txn) => ({
    transaction_id: txn.transaction_id,
    fee_percentage: newFeePercentage,
    calculated_fees: calculateFees(Number(txn.amount), newFeePercentage),
  }));

  const updated = await txnRepo.updateManyFeesByFundId(updates);

  return {
    updated_count: updated.length,
    new_fee_percentage: newFeePercentage,
    transactions: updated.map(serialize),
  };
}
