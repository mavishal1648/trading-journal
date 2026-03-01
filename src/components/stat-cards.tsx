import {
  BarChart3,
  DollarSign,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";

type DashboardStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  avgRiskReward: number;
  bestTrade: { pnl: number } | null;
  worstTrade: { pnl: number } | null;
  currentStreak: string;
};

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-4">
      {/* Top row: 3 main stat cards (larger) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.totalTrades}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.wins}W / {stats.losses}L / {stats.breakeven}B
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${stats.winRate >= 50 ? "border-l-green-500" : "border-l-red-500"}`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    stats.winRate >= 50 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatPercentage(stats.winRate)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.wins} out of {stats.totalTrades}
                </p>
              </div>
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  stats.winRate >= 50
                    ? "bg-green-500/10"
                    : "bg-red-500/10"
                }`}
              >
                <Target
                  className={`h-6 w-6 ${stats.winRate >= 50 ? "text-green-500" : "text-red-500"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${
            stats.totalPnl > 0
              ? "border-l-green-500"
              : stats.totalPnl < 0
                ? "border-l-red-500"
                : "border-l-muted"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    stats.totalPnl > 0
                      ? "text-green-500"
                      : stats.totalPnl < 0
                        ? "text-red-500"
                        : ""
                  }`}
                >
                  {formatCurrency(stats.totalPnl)}
                </p>
              </div>
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  stats.totalPnl > 0
                    ? "bg-green-500/10"
                    : stats.totalPnl < 0
                      ? "bg-red-500/10"
                      : "bg-muted/50"
                }`}
              >
                <DollarSign
                  className={`h-6 w-6 ${
                    stats.totalPnl > 0
                      ? "text-green-500"
                      : stats.totalPnl < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: 4 smaller stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Avg R:R</p>
                <p className="text-lg font-bold">
                  {stats.avgRiskReward.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Best Trade</p>
                <p className="text-lg font-bold text-green-500">
                  {stats.bestTrade
                    ? formatCurrency(stats.bestTrade.pnl)
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Worst Trade</p>
                <p className="text-lg font-bold text-red-500">
                  {stats.worstTrade
                    ? formatCurrency(stats.worstTrade.pnl)
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Flame
                className={`h-4 w-4 ${
                  stats.currentStreak.endsWith("W")
                    ? "text-green-500"
                    : stats.currentStreak.endsWith("L")
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              />
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p
                  className={`text-lg font-bold ${
                    stats.currentStreak.endsWith("W")
                      ? "text-green-500"
                      : stats.currentStreak.endsWith("L")
                        ? "text-red-500"
                        : ""
                  }`}
                >
                  {stats.currentStreak}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
