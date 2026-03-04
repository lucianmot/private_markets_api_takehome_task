vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: {
    fund: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma.js";
import {
  findAll,
  findById,
  create,
  update,
} from "../../../src/repositories/fund.repository.js";

describe("fund.repository", () => {
  it("findAll calls findMany with orderBy", async () => {
    await findAll();
    expect(prisma.fund.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
    });
  });

  it("findById calls findUnique with id", async () => {
    await findById("abc");
    expect(prisma.fund.findUnique).toHaveBeenCalledWith({
      where: { id: "abc" },
    });
  });

  it("create calls create with data", async () => {
    const data = {
      name: "Fund",
      vintage_year: 2024,
      target_size_usd: 1000000,
      status: "Fundraising" as const,
    };
    await create(data);
    expect(prisma.fund.create).toHaveBeenCalledWith({ data });
  });

  it("update calls update with id and data", async () => {
    await update("abc", { name: "Updated" });
    expect(prisma.fund.update).toHaveBeenCalledWith({
      where: { id: "abc" },
      data: { name: "Updated" },
    });
  });
});
