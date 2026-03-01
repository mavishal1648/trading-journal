import { INSTRUMENTS } from "@/lib/constants";

export function calculatePnl(
  instrument: string,
  direction: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  const config = INSTRUMENTS[instrument as keyof typeof INSTRUMENTS];
  if (!config) return 0;

  const ticks = (exitPrice - entryPrice) / config.tickSize;
  const pnl = ticks * config.tickValue * quantity;

  return direction === "SHORT" ? -pnl : pnl;
}
