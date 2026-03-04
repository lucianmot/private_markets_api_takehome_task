import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { RecalculateFeesSchema } from "../schemas/transaction.schema.js";
import {
  docResponse,
  RecalculateFeesResponseSchema,
  ErrorResponseSchema,
  ValidationErrorSchema,
} from "../schemas/response.schema.js";
import * as txnService from "../services/transaction.service.js";

export async function adminRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/admin/recalculate-fees",
    {
      schema: {
        body: RecalculateFeesSchema,
        response: docResponse({
          200: RecalculateFeesResponseSchema,
          400: ValidationErrorSchema,
          404: ErrorResponseSchema,
        }),
      },
    },
    async (request, reply) => {
      const result = await txnService.recalculateFees(
        request.body.fund_id,
        request.body.new_fee_percentage,
        request.body.apply_retroactively,
      );
      return reply.send(result);
    },
  );
}
