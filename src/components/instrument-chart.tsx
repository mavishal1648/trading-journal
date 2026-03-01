"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { BarChart3 } from "lucide-react";

interface InstrumentData {
  instrument: string;
  totalTrades: number;
  wins: number;
  winRate: number;
  netPnl: number;
  avgRiskReward: number;
}

interface InstrumentChartProps {
  data: InstrumentData[];
}

const chartConfig = {
  wins: {
    label: "Wins",
    color: "oklch(0.765 0.177 163.223)",
  },
  losses: {
    label: "Losses",
    color: "oklch(0.637 0.237 25.331)",
  },
} satisfies ChartConfig;

export function InstrumentChart({ data }: InstrumentChartProps) {
  const chartData = data.map((item) => ({
    instrument: item.instrument,
    wins: item.wins,
    losses: item.totalTrades - item.wins,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance by Instrument
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No instrument data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance by Instrument
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="instrument"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="wins"
              fill="var(--color-wins)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="losses"
              fill="var(--color-losses)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.map((item) => (
            <div
              key={item.instrument}
              className="rounded-lg border p-3 space-y-1"
            >
              <p className="text-sm font-semibold">{item.instrument}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate</span>
                <span
                  className={
                    item.winRate > 50
                      ? "text-green-500"
                      : item.winRate < 50
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }
                >
                  {formatPercentage(item.winRate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net P&L</span>
                <span
                  className={
                    item.netPnl > 0
                      ? "text-green-500"
                      : item.netPnl < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }
                >
                  {formatCurrency(item.netPnl)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg R:R</span>
                <span>{item.avgRiskReward.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
