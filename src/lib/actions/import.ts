"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ImportTradeData = {
  instrument: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  tradeDate: string;
  entryTime?: string;
  exitTime?: string;
  result: string;
  riskReward: number;
  rating: number;
};

export async function importTrades(
  trades: ImportTradeData[]
): Promise<{ success: boolean; imported: number; skipped: number; error?: string }> {
  try {
    let imported = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const trade of trades) {
        const tradeDate = new Date(trade.tradeDate);

        // Check for duplicate: same tradeDate + instrument + direction + entryPrice + pnl
        const existing = await tx.trade.findFirst({
          where: {
            tradeDate,
            instrument: trade.instrument,
            direction: trade.direction,
            entryPrice: trade.entryPrice,
            pnl: trade.pnl,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await tx.trade.create({
          data: {
            instrument: trade.instrument,
            direction: trade.direction,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            quantity: trade.quantity,
            pnl: trade.pnl,
            tradeDate,
            entryTime: trade.entryTime ? new Date(trade.entryTime) : undefined,
            exitTime: trade.exitTime ? new Date(trade.exitTime) : undefined,
            result: trade.result,
            riskReward: trade.riskReward ?? 0,
            rating: trade.rating ?? 3,
          },
        });

        imported++;
      }
    });

    revalidatePath("/trades");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");

    return { success: true, imported, skipped };
  } catch (error) {
    console.error("Failed to import trades:", error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Failed to import trades",
    };
  }
}
