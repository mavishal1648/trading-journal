"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CsvUpload } from "@/components/csv-upload";
import { ImportPreview } from "@/components/import-preview";
import { parseMT5File, type ParsedTrade } from "@/lib/utils/csv-parser";
import { importTrades, type ImportTradeData } from "@/lib/actions/import";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "upload" | "preview" | "done";

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "done", label: "Done" },
] as const;

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  function handleFileLoaded(csvText: string) {
    setParseError(null);
    try {
      const trades = parseMT5File(csvText);
      if (trades.length === 0) {
        toast.error("No valid trades found in CSV");
        return;
      }
      setParsedTrades(trades);
      setStep("preview");
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Failed to parse CSV file"
      );
    }
  }

  async function handleConfirmImport() {
    setIsImporting(true);
    try {
      const mappedTrades: ImportTradeData[] = parsedTrades.map((trade) => ({
        instrument: trade.instrument,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        pnl: trade.pnl,
        tradeDate: trade.tradeDate.toISOString(),
        entryTime: trade.entryTime.toISOString(),
        exitTime: trade.exitTime.toISOString(),
        result: trade.result,
        riskReward: 0,
        rating: 3,
      }));

      const result = await importTrades(mappedTrades);

      if (!result.success) {
        toast.error(result.error || "Failed to import trades");
        return;
      }

      toast.success(
        `Imported ${result.imported} trades${result.skipped > 0 ? `, ${result.skipped} duplicates skipped` : ""}`
      );
      setImportResult({ imported: result.imported, skipped: result.skipped });
      setStep("done");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import trades"
      );
    } finally {
      setIsImporting(false);
    }
  }

  function handleCancel() {
    setParsedTrades([]);
    setParseError(null);
    setStep("upload");
  }

  function handleImportMore() {
    setParsedTrades([]);
    setParseError(null);
    setImportResult(null);
    setStep("upload");
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Trades</h1>
        <p className="text-muted-foreground mt-2">
          Import your trades from MT5 CSV export
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, index) => (
          <div key={s.key} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-8 ${
                  STEPS.findIndex((st) => st.key === step) >= index
                    ? "bg-primary"
                    : "bg-muted-foreground/25"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                step === s.key
                  ? "bg-primary text-primary-foreground"
                  : STEPS.findIndex((st) => st.key === step) >
                      STEPS.findIndex((st) => st.key === s.key)
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{index + 1}</span>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Parse error */}
      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Parse Error</AlertTitle>
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      {step === "upload" && <CsvUpload onFileLoaded={handleFileLoaded} />}

      {step === "preview" && (
        <ImportPreview
          trades={parsedTrades}
          onConfirm={handleConfirmImport}
          onCancel={handleCancel}
          isImporting={isImporting}
        />
      )}

      {step === "done" && importResult && (
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              Successfully imported {importResult.imported} trades.{" "}
              {importResult.skipped} duplicates were skipped.
            </AlertDescription>
          </Alert>
          <Button onClick={handleImportMore}>Import More</Button>
        </div>
      )}
    </div>
  );
}
