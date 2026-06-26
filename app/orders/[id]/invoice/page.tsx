import { notFound } from "next/navigation";
import { getDeal } from "../../../actions/brokerage";
import InvoiceView from "./InvoiceView";

export const dynamic = "force-dynamic";

export default async function DealInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dealId = Number(id);
  if (Number.isNaN(dealId)) notFound();

  let deal;
  try {
    deal = await getDeal(dealId);
  } catch {
    deal = null;
  }
  if (!deal) notFound();

  return <InvoiceView deal={deal} />;
}
