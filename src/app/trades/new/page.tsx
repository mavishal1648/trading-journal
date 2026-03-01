import { TradeForm } from "@/components/trade-form";

export default function NewTradePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Trade</h1>
        <p className="text-muted-foreground mt-1">
          Log a new trade entry.
        </p>
      </div>
      <TradeForm mode="create" />
    </div>
  );
}
