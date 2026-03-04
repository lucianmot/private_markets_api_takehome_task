import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  CreateFundSchema,
  UpdateFundSchema,
  FundParamsSchema,
} from "../schemas/fund.schema.js";
import { InvestmentParamsSchema } from "../schemas/investment.schema.js";
import { TotalValueQuerySchema } from "../schemas/transaction.schema.js";
import * as fundService from "../services/fund.service.js";
import * as txnService from "../services/transaction.service.js";

export async function fundRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/funds", async (_request, reply) => {
    const funds = await fundService.getAllFunds();
    return reply.send(funds);
  });

  typedApp.post(
    "/funds",
    { schema: { body: CreateFundSchema } },
    async (request, reply) => {
      const fund = await fundService.createFund(request.body);
      return reply.status(201).send(fund);
    },
  );

  typedApp.get(
    "/funds/:id",
    { schema: { params: FundParamsSchema } },
    async (request, reply) => {
      const fund = await fundService.getFundById(request.params.id);
      return reply.send(fund);
    },
  );

  typedApp.put(
    "/funds/:id",
    { schema: { params: FundParamsSchema, body: UpdateFundSchema } },
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
