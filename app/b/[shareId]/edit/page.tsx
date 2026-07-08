import Link from "next/link";
import { BillEditor } from "@/components/bill/bill-editor";
import { getEditableBill } from "@/lib/bills/db";

export default async function EditBillPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { shareId } = await params;
  const { token = "" } = await searchParams;
  const bill = await getEditableBill(shareId, token);

  if (!bill) {
    return (
      <main className="barkada-shell min-h-screen text-foreground">
        <section className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-sm font-semibold uppercase text-primary">
            Bill Barkada
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Access denied</h1>
          <p className="mt-4 text-muted-foreground">
            This edit link is invalid or the edit token is missing.
          </p>
          <Link
            href={`/b/${shareId}`}
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            View public bill
          </Link>
        </section>
      </main>
    );
  }

  return <BillEditor initialBill={bill} cloudEdit={{ shareId, token }} />;
}
