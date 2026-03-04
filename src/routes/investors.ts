import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { CreateInvestorSchema } from "../schemas/investor.schema.js";
import * as investorService from "../services/investor.service.js";

export async function investorRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/investors", async (_request, reply) => {
    const investors = await investorService.getAllInvestors();
    return reply.send(investors);
  });

  typedApp.post(
    "/investors",
    { schema: { body: CreateInvestorSchema } },
    async (request, reply) => {
      const investor = await investorService.createInvestor(request.body);
      return reply.status(201).send(investor);
    },
  );
}
