import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Star } from "lucide-react";
import { getTradeById } from "@/lib/queries/trades";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/format";
import { MAX_RATING } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotViewer } from "@/components/screenshot-viewer";
import { TradeDeleteButton } from "@/components/trade-delete-button";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTradeById(id);

  if (!trade) {
    notFound();
  }

  const pnl = Number(trade.pnl);
  const entryPrice = Number(trade.entryPrice);
  const exitPrice = Number(trade.exitPrice);
  const riskReward = Number(trade.riskReward);
  const rating = trade.rating;

  const resultColor =
    trade.result === "WIN"
      ? "bg-green-500/15 text-green-500 border-green-500/30"
      : trade.result === "LOSS"
        ? "bg-red-500/15 text-red-500 border-red-500/30"
        : "";

  const resultVariant =
    trade.result === "BREAKEVEN" ? ("outline" as const) : ("default" as const);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/trades"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trades
      </Link>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">
                {trade.instrument} &mdash; {trade.direction}
              </CardTitle>
              <Badge
                variant={resultVariant}
                className={trade.result !== "BREAKEVEN" ? resultColor : ""}
              >
                {trade.result}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/trades/${trade.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit
                </Link>
              </Button>
              <TradeDeleteButton tradeId={trade.id} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Trade Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            <DetailItem label="Entry Price" value={entryPrice.toFixed(2)} />
            <DetailItem label="Exit Price" value={exitPrice.toFixed(2)} />
            <DetailItem label="Contracts" value={trade.quantity.toString()} />
            <DetailItem label="R:R Ratio" value={riskReward.toFixed(2)} />
            <DetailItem
              label="P&L"
              value={formatCurrency(pnl)}
              valueClassName={
                pnl > 0
                  ? "text-green-500"
                  : pnl < 0
                    ? "text-red-500"
                    : ""
              }
            />
            <DetailItem
              label="Trade Date"
              value={formatDate(trade.tradeDate)}
            />
            {trade.entryTime && (
              <DetailItem
                label="Entry Time"
                value={formatTime(trade.entryTime)}
              />
            )}
            {trade.exitTime && (
              <DetailItem
                label="Exit Time"
                value={formatTime(trade.exitTime)}
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rating</p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: MAX_RATING }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {trade.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trade.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color, color: "#fff" }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags</p>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {trade.notes ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {trade.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes added</p>
          )}
        </CardContent>
      </Card>

      {/* Screenshots Section */}
      <Card>
        <CardHeader>
          <CardTitle>Screenshots</CardTitle>
        </CardHeader>
        <CardContent>
          <ScreenshotViewer screenshots={trade.screenshots} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-medium ${valueClassName}`}>{value}</p>
    </div>
  );
}
