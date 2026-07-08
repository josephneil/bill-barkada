import Link from "next/link";
import { BillViewer } from "@/components/bill/bill-viewer";
import { getBillByShareId } from "@/lib/bills/db";

export default async function PublicBillPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const bill = await getBillByShareId(shareId);

  if (!bill) {
    return (
      <main className="barkada-shell min-h-screen text-foreground">
        <section className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-sm font-semibold uppercase text-primary">
            Bill Barkada
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Bill not found</h1>
          <p className="mt-4 text-muted-foreground">
            This public bill link may be incorrect or no longer available.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Create a new bill
          </Link>
        </section>
      </main>
    );
  }

  return <BillViewer bill={bill} />;
}
