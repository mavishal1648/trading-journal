import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { Tags } from "lucide-react";

interface TagData {
  tagId: string;
  tagName: string;
  tagColor: string;
  totalTrades: number;
  wins: number;
  winRate: number;
  netPnl: number;
}

interface TagPerformanceProps {
  data: TagData[];
}

export function TagPerformance({ data }: TagPerformanceProps) {
  const sorted = [...data].sort((a, b) => b.netPnl - a.netPnl);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Performance by Tag
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tagged trades yet
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((tag) => (
              <div
                key={tag.tagId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-transparent"
                    style={{ backgroundColor: tag.tagColor, color: "#fff" }}
                  >
                    {tag.tagName}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {tag.totalTrades} trade{tag.totalTrades !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className={
                      tag.winRate > 50
                        ? "text-green-500"
                        : tag.winRate < 50
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }
                  >
                    {formatPercentage(tag.winRate)}
                  </span>
                  <span
                    className={`font-medium ${
                      tag.netPnl > 0
                        ? "text-green-500"
                        : tag.netPnl < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {formatCurrency(tag.netPnl)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
