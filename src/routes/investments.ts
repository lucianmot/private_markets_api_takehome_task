import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  InvestmentParamsSchema,
  CreateInvestmentSchema,
} from "../schemas/investment.schema.js";
import {
  docResponse,
  InvestmentResponseSchema,
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../schemas/response.schema.js";
import * as investmentService from "../services/investment.service.js";

export async function investmentRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/funds/:fund_id/investments",
    {
      schema: {
        params: InvestmentParamsSchema,
        response: docResponse({
          200: z.array(InvestmentResponseSchema),
          404: ErrorResponseSchema,
        }),
      },
    },
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
        response: docResponse({
          201: InvestmentResponseSchema,
          400: ValidationErrorSchema,
          404: ErrorResponseSchema,
        }),
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
