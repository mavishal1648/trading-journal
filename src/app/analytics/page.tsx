import {
  getMonthlyBreakdown,
  getInstrumentPerformance,
  getTagPerformance,
} from "@/lib/queries/analytics";
import { CORRELATED_GROUPS } from "@/lib/constants";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { MonthlyTable } from "@/components/monthly-table";
import { InstrumentChart } from "@/components/instrument-chart";
import { TagPerformance } from "@/components/tag-performance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
  const [monthlyData, instrumentData, tagData] = await Promise.all([
    getMonthlyBreakdown(),
    getInstrumentPerformance(),
    getTagPerformance(),
  ]);

  // Build correlated group summaries
  const correlatedGroups = Object.entries(CORRELATED_GROUPS).map(
    ([groupName, instruments]) => {
      const matching = instrumentData.filter((d) =>
        (instruments as readonly string[]).includes(d.instrument)
      );
      const totalTrades = matching.reduce((sum, d) => sum + d.totalTrades, 0);
      const totalWins = matching.reduce((sum, d) => sum + d.wins, 0);
      const combinedPnl = matching.reduce((sum, d) => sum + d.netPnl, 0);
      const combinedWinRate =
        totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

      return {
        groupName,
        instruments: instruments.join(", "),
        totalTrades,
        combinedWinRate,
        combinedPnl,
      };
    }
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Monthly performance and insights
        </p>
      </div>

      <MonthlyTable data={monthlyData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <InstrumentChart data={instrumentData} />
        <TagPerformance data={tagData} />
      </div>

      {correlatedGroups.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {correlatedGroups.map((group) => (
            <Card key={group.groupName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {group.groupName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Combined stats for {group.instruments}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      Total Trades
                    </p>
                    <p className="text-xl font-semibold">
                      {group.totalTrades}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Win Rate</p>
                    <p
                      className={`text-xl font-semibold ${
                        group.combinedWinRate > 50
                          ? "text-green-500"
                          : group.combinedWinRate < 50
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatPercentage(group.combinedWinRate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Net P&L</p>
                    <p
                      className={`text-xl font-semibold ${
                        group.combinedPnl > 0
                          ? "text-green-500"
                          : group.combinedPnl < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(group.combinedPnl)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
