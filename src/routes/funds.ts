import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  CreateFundSchema,
  UpdateFundSchema,
  FundParamsSchema,
} from "../schemas/fund.schema.js";
import * as fundService from "../services/fund.service.js";

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
}
