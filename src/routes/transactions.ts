import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  ProcessTransactionSchema,
  ReverseTransactionSchema,
  TransactionParamsSchema,
} from "../schemas/transaction.schema.js";
import {
  docResponse,
  TransactionResponseSchema,
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../schemas/response.schema.js";
import * as txnService from "../services/transaction.service.js";

export async function transactionRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/transactions",
    {
      schema: {
        response: docResponse({ 200: z.array(TransactionResponseSchema) }),
      },
    },
    async (_request, reply) => {
      const transactions = await txnService.getAllTransactions();
      return reply.send(transactions);
    },
  );

  typedApp.post(
    "/transactions/process",
    {
      schema: {
        body: ProcessTransactionSchema,
        response: docResponse({
          201: TransactionResponseSchema,
          400: ValidationErrorSchema,
          404: ErrorResponseSchema,
        }),
      },
    },
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
        response: docResponse({
          200: TransactionResponseSchema,
          400: ValidationErrorSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        }),
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
