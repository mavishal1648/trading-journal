import { prisma } from "@/lib/prisma";
import type { TradeWithRelations } from "@/lib/types";

/** Convert Prisma Decimal fields to plain numbers for Client Components */
function serializeTrade(trade: TradeWithRelations): TradeWithRelations {
  return {
    ...trade,
    entryPrice: Number(trade.entryPrice),
    exitPrice: Number(trade.exitPrice),
    riskReward: Number(trade.riskReward),
    pnl: Number(trade.pnl),
  } as unknown as TradeWithRelations;
}

export async function getTradeById(
  id: string
): Promise<TradeWithRelations | null> {
  const trade = await prisma.trade.findUnique({
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
  return trade ? serializeTrade(trade) : null;
}

export async function getAllTrades(): Promise<TradeWithRelations[]> {
  const trades = await prisma.trade.findMany({
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
  return trades.map(serializeTrade);
}
