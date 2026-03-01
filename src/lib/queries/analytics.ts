import { prisma } from "@/lib/prisma";
import type { TradeWithRelations, MonthlyStats } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

// ─── 1. Dashboard Stats ───────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [aggregations, trades] = await Promise.all([
    prisma.trade.aggregate({
      _count: { id: true },
      _sum: { pnl: true },
      _avg: { riskReward: true },
    }),
    prisma.trade.findMany({
      orderBy: { tradeDate: "desc" },
      select: { id: true, result: true, pnl: true },
    }),
  ]);

  const totalTrades = aggregations._count.id;
  const totalPnl = toNumber(aggregations._sum.pnl);
  const avgRiskReward = toNumber(aggregations._avg.riskReward);

  const wins = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const breakeven = trades.filter((t) => t.result === "BREAKEVEN").length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Best and worst trade by pnl
  let bestTrade = null;
  let worstTrade = null;
  if (totalTrades > 0) {
    [bestTrade, worstTrade] = await Promise.all([
      prisma.trade.findFirst({ orderBy: { pnl: "desc" } }),
      prisma.trade.findFirst({ orderBy: { pnl: "asc" } }),
    ]);
  }

  // Current streak: count consecutive same-result trades from most recent
  let currentStreak = "0";
  if (trades.length > 0) {
    const firstResult = trades[0].result;
    let count = 0;
    for (const trade of trades) {
      if (trade.result === firstResult) {
        count++;
      } else {
        break;
      }
    }
    const suffix =
      firstResult === "WIN" ? "W" : firstResult === "LOSS" ? "L" : "B";
    currentStreak = `${count}${suffix}`;
  }

  return {
    totalTrades,
    wins,
    losses,
    breakeven,
    winRate,
    totalPnl,
    avgRiskReward,
    bestTrade: bestTrade
      ? {
          ...bestTrade,
          pnl: toNumber(bestTrade.pnl),
          entryPrice: toNumber(bestTrade.entryPrice),
          exitPrice: toNumber(bestTrade.exitPrice),
          riskReward: toNumber(bestTrade.riskReward),
        }
      : null,
    worstTrade: worstTrade
      ? {
          ...worstTrade,
          pnl: toNumber(worstTrade.pnl),
          entryPrice: toNumber(worstTrade.entryPrice),
          exitPrice: toNumber(worstTrade.exitPrice),
          riskReward: toNumber(worstTrade.riskReward),
        }
      : null,
    currentStreak,
  };
}

// ─── 2. Equity Curve Data ─────────────────────────────────────────────────────

export async function getEquityCurveData(): Promise<
  { date: string; cumulativePnl: number }[]
> {
  const trades = await prisma.trade.findMany({
    orderBy: { tradeDate: "asc" },
    select: { tradeDate: true, pnl: true },
  });

  // Group by date and sum pnl
  const dailyPnlMap = new Map<string, number>();
  for (const trade of trades) {
    const date = toDateString(trade.tradeDate);
    dailyPnlMap.set(date, (dailyPnlMap.get(date) ?? 0) + toNumber(trade.pnl));
  }

  // Build cumulative curve
  let cumulative = 0;
  const result: { date: string; cumulativePnl: number }[] = [];
  for (const [date, pnl] of dailyPnlMap) {
    cumulative += pnl;
    result.push({ date, cumulativePnl: cumulative });
  }

  return result;
}

// ─── 3. Calendar Heatmap Data ─────────────────────────────────────────────────

export type CalendarDayTrade = {
  id: string;
  instrument: string;
  direction: string;
  result: string;
  pnl: number;
};

export type CalendarDayData = {
  date: string;
  pnl: number;
  count: number;
  trades: CalendarDayTrade[];
};

export async function getCalendarHeatmapData(): Promise<CalendarDayData[]> {
  const trades = await prisma.trade.findMany({
    select: {
      id: true,
      tradeDate: true,
      pnl: true,
      instrument: true,
      direction: true,
      result: true,
    },
  });

  const dayMap = new Map<
    string,
    { pnl: number; count: number; trades: CalendarDayTrade[] }
  >();
  for (const trade of trades) {
    const date = toDateString(trade.tradeDate);
    const existing = dayMap.get(date) ?? { pnl: 0, count: 0, trades: [] };
    const pnl = toNumber(trade.pnl);
    existing.pnl += pnl;
    existing.count += 1;
    existing.trades.push({
      id: trade.id,
      instrument: trade.instrument,
      direction: trade.direction,
      result: trade.result,
      pnl,
    });
    dayMap.set(date, existing);
  }

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    pnl: data.pnl,
    count: data.count,
    trades: data.trades,
  }));
}

// ─── 4. Monthly Breakdown ─────────────────────────────────────────────────────

export async function getMonthlyBreakdown(): Promise<MonthlyStats[]> {
  const trades = await prisma.trade.findMany({
    select: { tradeDate: true, result: true, pnl: true },
    orderBy: { tradeDate: "asc" },
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Group by year-month
  const monthMap = new Map<
    string,
    {
      year: number;
      month: string;
      trades: { result: string; pnl: number; date: string }[];
    }
  >();

  for (const trade of trades) {
    const d = trade.tradeDate;
    const year = d.getFullYear();
    const monthNum = d.getMonth();
    const key = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { year, month: monthNames[monthNum], trades: [] });
    }
    monthMap.get(key)!.trades.push({
      result: trade.result,
      pnl: toNumber(trade.pnl),
      date: toDateString(d),
    });
  }

  const stats: MonthlyStats[] = [];

  for (const [, data] of monthMap) {
    const totalTrades = data.trades.length;
    const wins = data.trades.filter((t) => t.result === "WIN").length;
    const losses = data.trades.filter((t) => t.result === "LOSS").length;
    const breakeven = data.trades.filter(
      (t) => t.result === "BREAKEVEN"
    ).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const netPnl = data.trades.reduce((sum, t) => sum + t.pnl, 0);

    // Green/red days
    const dayPnlMap = new Map<string, number>();
    for (const t of data.trades) {
      dayPnlMap.set(t.date, (dayPnlMap.get(t.date) ?? 0) + t.pnl);
    }
    let greenDays = 0;
    let redDays = 0;
    for (const [, dayPnl] of dayPnlMap) {
      if (dayPnl > 0) greenDays++;
      else if (dayPnl < 0) redDays++;
    }

    stats.push({
      month: data.month,
      year: data.year,
      totalTrades,
      wins,
      losses,
      breakeven,
      winRate,
      greenDays,
      redDays,
      netPnl,
    });
  }

  // Sort descending by date (most recent first)
  stats.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return monthNames.indexOf(b.month) - monthNames.indexOf(a.month);
  });

  return stats;
}

// ─── 5. Instrument Performance ────────────────────────────────────────────────

export async function getInstrumentPerformance(): Promise<
  {
    instrument: string;
    totalTrades: number;
    wins: number;
    winRate: number;
    netPnl: number;
    avgRiskReward: number;
  }[]
> {
  const trades = await prisma.trade.findMany({
    select: { instrument: true, result: true, pnl: true, riskReward: true },
  });

  const instrumentMap = new Map<
    string,
    { trades: number; wins: number; pnl: number; rrSum: number }
  >();

  for (const trade of trades) {
    const existing = instrumentMap.get(trade.instrument) ?? {
      trades: 0,
      wins: 0,
      pnl: 0,
      rrSum: 0,
    };
    existing.trades += 1;
    if (trade.result === "WIN") existing.wins += 1;
    existing.pnl += toNumber(trade.pnl);
    existing.rrSum += toNumber(trade.riskReward);
    instrumentMap.set(trade.instrument, existing);
  }

  return Array.from(instrumentMap.entries()).map(([instrument, data]) => ({
    instrument,
    totalTrades: data.trades,
    wins: data.wins,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    netPnl: data.pnl,
    avgRiskReward: data.trades > 0 ? data.rrSum / data.trades : 0,
  }));
}

// ─── 6. Tag Performance ──────────────────────────────────────────────────────

export async function getTagPerformance(): Promise<
  {
    tagId: string;
    tagName: string;
    tagColor: string;
    totalTrades: number;
    wins: number;
    winRate: number;
    netPnl: number;
  }[]
> {
  const tags = await prisma.tag.findMany({
    include: {
      trades: {
        include: {
          trade: {
            select: { result: true, pnl: true },
          },
        },
      },
    },
  });

  return tags.map((tag) => {
    const totalTrades = tag.trades.length;
    const wins = tag.trades.filter((tt) => tt.trade.result === "WIN").length;
    const netPnl = tag.trades.reduce(
      (sum, tt) => sum + toNumber(tt.trade.pnl),
      0
    );

    return {
      tagId: tag.id,
      tagName: tag.name,
      tagColor: tag.color,
      totalTrades,
      wins,
      winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
      netPnl,
    };
  });
}

// ─── 7. Recent Trades ─────────────────────────────────────────────────────────

export async function getRecentTrades(
  limit: number = 5
): Promise<TradeWithRelations[]> {
  const trades = await prisma.trade.findMany({
    take: limit,
    orderBy: { tradeDate: "desc" },
    include: {
      screenshots: true,
      tags: {
        include: { tag: true },
      },
    },
  });
  return trades.map((t) => ({
    ...t,
    entryPrice: Number(t.entryPrice),
    exitPrice: Number(t.exitPrice),
    riskReward: Number(t.riskReward),
    pnl: Number(t.pnl),
  })) as unknown as TradeWithRelations[];
}
