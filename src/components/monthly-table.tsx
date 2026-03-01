import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import type { MonthlyStats } from "@/lib/types";
import { CalendarDays } from "lucide-react";

interface MonthlyTableProps {
  data: MonthlyStats[];
}

export function MonthlyTable({ data }: MonthlyTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No trading data yet. Start logging trades to see monthly stats.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Monthly Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="text-right">Losses</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Green Days</TableHead>
              <TableHead className="text-right">Red Days</TableHead>
              <TableHead className="text-right">Net P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={`${row.month}-${row.year}`}>
                <TableCell className="font-medium">
                  {row.month} {row.year}
                </TableCell>
                <TableCell className="text-right">{row.totalTrades}</TableCell>
                <TableCell className="text-right">{row.wins}</TableCell>
                <TableCell className="text-right">{row.losses}</TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    row.winRate > 50
                      ? "text-green-500"
                      : row.winRate < 50
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {formatPercentage(row.winRate)}
                </TableCell>
                <TableCell className="text-right text-green-500">
                  {row.greenDays}
                </TableCell>
                <TableCell className="text-right text-red-500">
                  {row.redDays}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    row.netPnl > 0
                      ? "text-green-500"
                      : row.netPnl < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(row.netPnl)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
