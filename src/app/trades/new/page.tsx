"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
import { TradeForm } from "@/components/trade-form";
import { parseMT5File, type ParsedTrade } from "@/lib/utils/csv-parser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";

export default function NewTradePage() {
  const [showImport, setShowImport] = useState(false);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<ParsedTrade | undefined>();
  const [formKey, setFormKey] = useState(0);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const trades = parseMT5File(text);
        if (trades.length === 0) {
          toast.error("No valid NQ/ES trades found in CSV");
          return;
        }
        setParsedTrades(trades);
        toast.success(`Found ${trades.length} trades`);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  }

  function selectTrade(trade: ParsedTrade) {
    setSelectedTrade(trade);
    setFormKey((k) => k + 1); // force TradeForm remount with new defaults
    setShowImport(false);
    toast.success("Trade data prefilled — add your R:R, rating, tags & notes");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Trade</h1>
        <p className="text-muted-foreground mt-1">
          Log a new trade entry.
        </p>
      </div>

      {/* CSV Prefill Section */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImport(!showImport)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Prefill from MT5 CSV
          {showImport ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>

        {showImport && (
          <div className="mt-3 rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,.html,.htm"
                onChange={handleFileUpload}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {parsedTrades.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {parsedTrades.length} trades found — click one to prefill
                </span>
              )}
            </div>

            {parsedTrades.length > 0 && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {parsedTrades.map((trade, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectTrade(trade)}
                    className="w-full flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {trade.tradeDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Badge variant="secondary">{trade.instrument}</Badge>
                      <span
                        className={`text-sm font-medium ${
                          trade.direction === "LONG"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {trade.direction}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {trade.entryPrice} → {trade.exitPrice}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={trade.result === "BREAKEVEN" ? "outline" : "default"}
                        className={
                          trade.result === "WIN"
                            ? "bg-green-600 hover:bg-green-600/90"
                            : trade.result === "LOSS"
                              ? "bg-red-600 hover:bg-red-600/90"
                              : ""
                        }
                      >
                        {trade.result}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${
                          trade.pnl > 0
                            ? "text-green-500"
                            : trade.pnl < 0
                              ? "text-red-500"
                              : ""
                        }`}
                      >
                        {formatCurrency(trade.pnl)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TradeForm key={formKey} mode="create" prefillData={selectedTrade} />
    </div>
  );
}
