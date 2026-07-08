"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateBill, createShareText } from "@/lib/bill-calculator";
import { duplicateBillForLocal } from "@/lib/bills/duplicate";
import { saveBillState } from "@/lib/storage";
import type { BillState } from "@/lib/types";
import { ReceiptSummaryCard } from "./receipt-summary-card";

export function BillViewer({ bill }: { bill: BillState }) {
  const calculation = useMemo(() => calculateBill(bill), [bill]);
  const [copied, setCopied] = useState(false);

  async function copySummary() {
    await navigator.clipboard.writeText(createShareText(bill, calculation));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function duplicateBill() {
    saveBillState(duplicateBillForLocal(bill));
    window.location.href = "/";
  }

  return (
    <main className="barkada-shell min-h-screen text-foreground">
      <section className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-primary">
            Bill Barkada
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
            Public bill receipt
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            View-only summary. Duplicate it to start your own editable copy.
          </p>
        </div>

        <div className="space-y-6">
          <ReceiptSummaryCard
            bill={bill}
            calculation={calculation}
            copied={copied}
            shareLinkMessage=""
            isSharedBill={false}
            onTogglePayment={() => undefined}
            onCopy={copySummary}
            readOnlyStatuses
          />

          <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="text-lg">Reuse This Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={duplicateBill} className="h-11 w-full">
                Duplicate Bill
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
