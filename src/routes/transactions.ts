import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  ProcessTransactionSchema,
  ReverseTransactionSchema,
  TransactionParamsSchema,
} from "../schemas/transaction.schema.js";
import * as txnService from "../services/transaction.service.js";

export async function transactionRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/transactions", async (_request, reply) => {
    const transactions = await txnService.getAllTransactions();
    return reply.send(transactions);
  });

  typedApp.post(
    "/transactions/process",
    { schema: { body: ProcessTransactionSchema } },
    async (request, reply) => {
      const transaction = await txnService.processTransaction(request.body);
      return reply.status(201).send(transaction);
    },
  );

  typedApp.put(
    "/transactions/:transaction_id/reverse",
    {
      schema: {
        params: TransactionParamsSchema,
        body: ReverseTransactionSchema,
      },
    },
    async (request, reply) => {
      const transaction = await txnService.reverseTransaction(
        request.params.transaction_id,
        request.body.reason,
        request.body.refund_fees,
      );
      return reply.send(transaction);
    },
  );
}
