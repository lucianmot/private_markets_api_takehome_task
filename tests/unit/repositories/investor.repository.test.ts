vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: {
    investor: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma.js";
import {
  findAll,
  create,
} from "../../../src/repositories/investor.repository.js";

describe("investor.repository", () => {
  it("findAll calls findMany with orderBy", async () => {
    await findAll();
    expect(prisma.investor.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
    });
  });

  it("create calls create with data", async () => {
    const data = {
      name: "Investor",
      investor_type: "Individual" as const,
      email: "test@example.com",
    };
    await create(data);
    expect(prisma.investor.create).toHaveBeenCalledWith({ data });
  });
});
