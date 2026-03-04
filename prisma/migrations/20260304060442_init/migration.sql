-- CreateEnum
CREATE TYPE "FundStatus" AS ENUM ('Fundraising', 'Investing', 'Closed');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('Individual', 'Institution', 'FamilyOffice');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'reversed');

-- CreateTable
CREATE TABLE "Fund" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vintage_year" INTEGER NOT NULL,
    "target_size_usd" DECIMAL(18,2) NOT NULL,
    "status" "FundStatus" NOT NULL DEFAULT 'Fundraising',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "investor_type" "InvestorType" NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" UUID NOT NULL,
    "fund_id" UUID NOT NULL,
    "investor_id" UUID NOT NULL,
    "amount_usd" DECIMAL(18,2) NOT NULL,
    "investment_date" DATE NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "transaction_id" UUID NOT NULL,
    "fund_id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "fee_percentage" DECIMAL(5,4) NOT NULL,
    "calculated_fees" DECIMAL(18,2),
    "auto_calculate_fees" BOOLEAN NOT NULL DEFAULT false,
    "bypass_validation" BOOLEAN NOT NULL DEFAULT false,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "reversed_at" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
