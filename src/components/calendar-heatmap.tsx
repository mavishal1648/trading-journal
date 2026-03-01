"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils/format";
import type {
  CalendarDayData,
  CalendarDayTrade,
} from "@/lib/queries/analytics";

type CalendarHeatmapProps = {
  data: CalendarDayData[];
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    pnl: number;
    trades: CalendarDayTrade[];
  } | null>(null);

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const { cells, dayMap } = useMemo(() => {
    const map = new Map<
      string,
      { pnl: number; count: number; trades: CalendarDayTrade[] }
    >();
    for (const d of data) {
      map.set(d.date, { pnl: d.pnl, count: d.count, trades: d.trades });
    }

    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();

    const gridCells: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      gridCells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      gridCells.push(d);
    }
    // Always pad to 42 cells (6 rows) so height stays fixed
    while (gridCells.length < 42) {
      gridCells.push(null);
    }

    return { cells: gridCells, dayMap: map };
  }, [data, viewYear, viewMonth]);

  function getDateString(day: number): string {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  }

  function getCellColor(day: number): string {
    const dateStr = getDateString(day);
    const entry = dayMap.get(dateStr);
    if (!entry) return "bg-muted/50";
    if (entry.pnl > 0)
      return "bg-green-500/60 text-white dark:bg-green-500/70";
    if (entry.pnl < 0) return "bg-red-500/60 text-white dark:bg-red-500/70";
    return "bg-yellow-500/40";
  }

  function handleDayClick(day: number) {
    const dateStr = getDateString(day);
    const entry = dayMap.get(dateStr);
    if (entry && entry.trades.length > 0) {
      setSelectedDay({
        date: dateStr,
        pnl: entry.pnl,
        trades: entry.trades,
      });
    }
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trading Calendar</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{monthName}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {!isCurrentMonth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewMonth(now.getMonth());
                    setViewYear(now.getFullYear());
                  }}
                >
                  Today
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground font-medium pb-1"
              >
                {day}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              const dateStr = getDateString(day);
              const entry = dayMap.get(dateStr);
              const hasTrades = entry && entry.count > 0;

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${getCellColor(day)} ${
                        hasTrades
                          ? "cursor-pointer hover:ring-2 hover:ring-primary/50"
                          : "cursor-default"
                      }`}
                    >
                      {day}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{dateStr}</p>
                    {entry ? (
                      <>
                        <p>P&L: {formatCurrency(entry.pnl)}</p>
                        <p>Trades: {entry.count}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No trades</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trades on {selectedDay?.date}</DialogTitle>
            <p
              className={`text-sm font-medium ${
                (selectedDay?.pnl ?? 0) > 0
                  ? "text-green-500"
                  : (selectedDay?.pnl ?? 0) < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              Day P&L: {formatCurrency(selectedDay?.pnl ?? 0)}
            </p>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {selectedDay?.trades.map((trade) => (
              <Link
                key={trade.id}
                href={`/trades/${trade.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{trade.instrument}</Badge>
                  <span
                    className={
                      trade.direction === "LONG"
                        ? "text-green-500 font-medium text-sm"
                        : "text-red-500 font-medium text-sm"
                    }
                  >
                    {trade.direction}
                  </span>
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
                </div>
                <span
                  className={`font-medium text-sm ${
                    trade.pnl > 0
                      ? "text-green-500"
                      : trade.pnl < 0
                        ? "text-red-500"
                        : ""
                  }`}
                >
                  {formatCurrency(trade.pnl)}
                </span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
