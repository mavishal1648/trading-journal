import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllTrades } from "@/lib/queries/trades";
import { TradesTable } from "@/components/trades-table";
import { Button } from "@/components/ui/button";

export default async function TradesPage() {
  const trades = await getAllTrades();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <p className="text-muted-foreground mt-1">Your trade history</p>
        </div>
        <Button asChild>
          <Link href="/trades/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Link>
        </Button>
      </div>
      <TradesTable data={trades} />
    </div>
  );
}
