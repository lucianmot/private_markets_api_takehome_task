export function calculateFees(amount: number, feePercentage: number): number {
  return Math.round(amount * (feePercentage / 100) * 100) / 100;
}

export function shouldAutoCalculate(
  autoCalculateFees: boolean,
  bypassValidation: boolean,
): boolean {
  return autoCalculateFees && !bypassValidation;
}
