import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { CreateInvestorSchema } from "../schemas/investor.schema.js";
import {
  docResponse,
  InvestorResponseSchema,
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../schemas/response.schema.js";
import * as investorService from "../services/investor.service.js";

export async function investorRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/investors",
    {
      schema: {
        response: docResponse({ 200: z.array(InvestorResponseSchema) }),
      },
    },
    async (_request, reply) => {
      const investors = await investorService.getAllInvestors();
      return reply.send(investors);
    },
  );

  typedApp.post(
    "/investors",
    {
      schema: {
        body: CreateInvestorSchema,
        response: docResponse({
          201: InvestorResponseSchema,
          400: ValidationErrorSchema,
          409: ErrorResponseSchema,
        }),
      },
    },
    async (request, reply) => {
      const investor = await investorService.createInvestor(request.body);
      return reply.status(201).send(investor);
    },
  );
}
