import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  InvestmentParamsSchema,
  CreateInvestmentSchema,
} from "../schemas/investment.schema.js";
import * as investmentService from "../services/investment.service.js";

export async function investmentRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/funds/:fund_id/investments",
    { schema: { params: InvestmentParamsSchema } },
    async (request, reply) => {
      const investments = await investmentService.getInvestmentsByFundId(
        request.params.fund_id,
      );
      return reply.send(investments);
    },
  );

  typedApp.post(
    "/funds/:fund_id/investments",
    {
      schema: {
        params: InvestmentParamsSchema,
        body: CreateInvestmentSchema,
      },
    },
    async (request, reply) => {
      const investment = await investmentService.createInvestment(
        request.params.fund_id,
        request.body,
      );
      return reply.status(201).send(investment);
    },
  );
}
