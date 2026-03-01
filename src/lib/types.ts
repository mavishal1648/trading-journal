import type { Trade, Screenshot, Tag, TradeTag } from "@/generated/prisma/client";

export type { Trade, Screenshot, Tag, TradeTag };

export type TradeWithRelations = Trade & {
  screenshots: Screenshot[];
  tags: (TradeTag & { tag: Tag })[];
};

export type TradeFormData = {
  instrument: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  riskReward: number;
  result: string;
  pnl: number;
  rating: number;
  notes: string;
  tradeDate: Date;
  entryTime?: Date;
  exitTime?: Date;
  tagIds: string[];
  screenshots: File[];
};

export type InstrumentKey = keyof typeof import("./constants").INSTRUMENTS;

export type MonthlyStats = {
  month: string;
  year: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  greenDays: number;
  redDays: number;
  netPnl: number;
};
