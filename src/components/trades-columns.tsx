"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TradeWithRelations } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export function getColumns(
  onDelete: (tradeId: string) => void
): ColumnDef<TradeWithRelations>[] {
  return [
    {
      accessorKey: "tradeDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.getValue("tradeDate")),
    },
    {
      accessorKey: "instrument",
      header: "Instrument",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue("instrument")}</Badge>
      ),
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: ({ row }) => {
        const direction = row.getValue("direction") as string;
        return (
          <span
            className={
              direction === "LONG"
                ? "text-green-500 font-medium"
                : "text-red-500 font-medium"
            }
          >
            {direction}
          </span>
        );
      },
    },
    {
      id: "entryExit",
      header: "Entry / Exit",
      cell: ({ row }) => {
        const entry = Number(row.original.entryPrice).toFixed(2);
        const exit = Number(row.original.exitPrice).toFixed(2);
        return (
          <span className="text-muted-foreground">
            {entry} / {exit}
          </span>
        );
      },
    },
    {
      accessorKey: "riskReward",
      header: "R:R",
      cell: ({ row }) => Number(row.getValue("riskReward")).toFixed(2),
    },
    {
      accessorKey: "result",
      header: "Result",
      cell: ({ row }) => {
        const result = row.getValue("result") as string;
        const variant =
          result === "WIN"
            ? "default"
            : result === "LOSS"
              ? "destructive"
              : "outline";
        const className =
          result === "WIN" ? "bg-green-600 hover:bg-green-600/90" : undefined;
        return (
          <Badge variant={variant} className={className}>
            {result}
          </Badge>
        );
      },
    },
    {
      accessorKey: "pnl",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          P&L
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const pnl = Number(row.getValue("pnl"));
        return (
          <span
            className={
              pnl > 0
                ? "text-green-500 font-medium"
                : pnl < 0
                  ? "text-red-500 font-medium"
                  : "text-muted-foreground"
            }
          >
            {formatCurrency(pnl)}
          </span>
        );
      },
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number;
        const stars = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
        return <span className="text-yellow-500">{stars}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const trade = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/trades/${trade.id}`}>
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/trades/${trade.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(trade.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
