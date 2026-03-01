import { notFound } from "next/navigation";
import { TradeForm } from "@/components/trade-form";
import { getTradeById } from "@/lib/queries/trades";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTradeById(id);

  if (!trade) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Trade</h1>
        <p className="text-muted-foreground mt-1">Update trade details.</p>
      </div>
      <TradeForm mode="edit" initialData={trade} />
    </div>
  );
}
