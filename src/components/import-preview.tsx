"use client";

import type { ParsedTrade } from "@/lib/utils/csv-parser";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ImportPreviewProps = {
  trades: ParsedTrade[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
};

export function ImportPreview({
  trades,
  onConfirm,
  onCancel,
  isImporting,
}: ImportPreviewProps) {
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);

  const getResult = (pnl: number): "WIN" | "LOSS" | "BREAKEVEN" => {
    if (pnl > 0) return "WIN";
    if (pnl < 0) return "LOSS";
    return "BREAKEVEN";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{trades.length} trades found</span>
          <span
            className={totalPnl >= 0 ? "text-green-600" : "text-red-600"}
          >
            Total P&amp;L: {formatCurrency(totalPnl)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Entry Price</TableHead>
                <TableHead className="text-right">Exit Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">P&amp;L</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => {
                const result = getResult(trade.pnl);

                return (
                  <TableRow key={index}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(trade.tradeDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{trade.instrument}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          trade.direction === "LONG"
                            ? "font-medium text-green-600"
                            : "font-medium text-red-600"
                        }
                      >
                        {trade.direction}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.entryPrice}
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.exitPrice}
                    </TableCell>
                    <TableCell className="text-right">{trade.quantity}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(trade.pnl)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={result === "BREAKEVEN" ? "outline" : "default"}
                        className={
                          result === "WIN"
                            ? "bg-green-600 hover:bg-green-700"
                            : result === "LOSS"
                              ? "bg-red-600 hover:bg-red-700"
                              : ""
                        }
                      >
                        {result}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {trades.length} Trades
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
