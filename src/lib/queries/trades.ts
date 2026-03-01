import { prisma } from "@/lib/prisma";
import type { TradeWithRelations } from "@/lib/types";

export async function getTradeById(
  id: string
): Promise<TradeWithRelations | null> {
  return prisma.trade.findUnique({
    where: { id },
    include: {
      screenshots: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function getAllTrades(): Promise<TradeWithRelations[]> {
  return prisma.trade.findMany({
    include: {
      screenshots: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { tradeDate: "desc" },
  });
}
