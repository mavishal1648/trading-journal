import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCards } from "@/components/stat-cards";
import { EquityCurve } from "@/components/equity-curve";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import {
  getDashboardStats,
  getEquityCurveData,
  getCalendarHeatmapData,
  getRecentTrades,
} from "@/lib/queries/analytics";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function DashboardPage() {
  const [stats, equityData, calendarData, recentTrades] = await Promise.all([
    getDashboardStats(),
    getEquityCurveData(),
    getCalendarHeatmapData(),
    getRecentTrades(5),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your trading overview</p>
        </div>
        <Button asChild>
          <Link href="/trades/new">Add Trade</Link>
        </Button>
      </div>

      <StatCards stats={stats} />

      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <EquityCurve data={equityData} />
        <CalendarHeatmap data={calendarData} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your last 5 trades</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/trades">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No trades yet. Start logging your trades.
              </p>
              <Button asChild className="mt-4">
                <Link href="/trades/new">Add Your First Trade</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((trade) => {
                  const pnl = Number(trade.pnl);
                  return (
                    <TableRow
                      key={trade.id}
                      className={
                        trade.result === "WIN"
                          ? "bg-green-500/5"
                          : trade.result === "LOSS"
                            ? "bg-red-500/5"
                            : ""
                      }
                    >
                      <TableCell>
                        <Link
                          href={`/trades/${trade.id}`}
                          className="hover:underline font-medium"
                        >
                          {formatDate(trade.tradeDate)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{trade.instrument}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            trade.direction === "LONG"
                              ? "text-green-500 font-medium"
                              : "text-red-500 font-medium"
                          }
                        >
                          {trade.direction}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.result === "WIN"
                              ? "default"
                              : trade.result === "LOSS"
                                ? "destructive"
                                : "outline"
                          }
                          className={
                            trade.result === "WIN"
                              ? "bg-green-600 hover:bg-green-600/90"
                              : undefined
                          }
                        >
                          {trade.result}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          pnl > 0
                            ? "text-green-500"
                            : pnl < 0
                              ? "text-red-500"
                              : ""
                        }`}
                      >
                        {formatCurrency(pnl)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
