import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  CreateFundSchema,
  UpdateFundSchema,
  FundParamsSchema,
} from "../schemas/fund.schema.js";
import { InvestmentParamsSchema } from "../schemas/investment.schema.js";
import { TotalValueQuerySchema } from "../schemas/transaction.schema.js";
import {
  docResponse,
  FundResponseSchema,
  TotalValueResponseSchema,
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../schemas/response.schema.js";
import * as fundService from "../services/fund.service.js";
import * as txnService from "../services/transaction.service.js";

export async function fundRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/funds",
    {
      schema: {
        response: docResponse({ 200: z.array(FundResponseSchema) }),
      },
    },
    async (_request, reply) => {
      const funds = await fundService.getAllFunds();
      return reply.send(funds);
    },
  );

  typedApp.post(
    "/funds",
    {
      schema: {
        body: CreateFundSchema,
        response: docResponse({
          201: FundResponseSchema,
          400: ValidationErrorSchema,
        }),
      },
    },
    async (request, reply) => {
      const fund = await fundService.createFund(request.body);
      return reply.status(201).send(fund);
    },
  );

  typedApp.get(
    "/funds/:id",
    {
      schema: {
        params: FundParamsSchema,
        response: docResponse({
          200: FundResponseSchema,
          404: ErrorResponseSchema,
        }),
      },
    },
    async (request, reply) => {
      const fund = await fundService.getFundById(request.params.id);
      return reply.send(fund);
    },
  );

  typedApp.put(
    "/funds/:id",
    {
      schema: {
        params: FundParamsSchema,
        body: UpdateFundSchema,
        response: docResponse({
          200: FundResponseSchema,
          400: ValidationErrorSchema,
          404: ErrorResponseSchema,
        }),
      },
    },
    async (request, reply) => {
      const fund = await fundService.updateFund(
        request.params.id,
        request.body,
      );
      return reply.send(fund);
    },
  );

  typedApp.get(
    "/funds/:fund_id/total-value",
    {
      schema: {
        params: InvestmentParamsSchema,
        querystring: TotalValueQuerySchema,
        response: docResponse({
          200: TotalValueResponseSchema,
          404: ErrorResponseSchema,
        }),
      },
    },
    async (request, reply) => {
      const includePending = request.query.include_pending === "true";
      const result = await txnService.getFundTotalValue(
        request.params.fund_id,
        includePending,
      );
      return reply.send(result);
    },
  );
}
