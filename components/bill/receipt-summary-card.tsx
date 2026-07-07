"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPeso } from "@/lib/bill-calculator";
import type { BillCalculation, BillState } from "@/lib/types";

export function ReceiptSummaryCard({
  bill,
  calculation,
  copied,
  shareLinkMessage,
  isSharedBill,
  onTogglePayment,
  onCopy,
  onCreateShareLink,
  onReset,
}: {
  bill: BillState;
  calculation: BillCalculation;
  copied: boolean;
  shareLinkMessage: string;
  isSharedBill: boolean;
  onTogglePayment: (personId: string) => void;
  onCopy: () => void;
  onCreateShareLink: () => void;
  onReset: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [expandedPeople, setExpandedPeople] = useState<Record<string, boolean>>(
    {},
  );
  const [exportMessage, setExportMessage] = useState("");

  async function exportSummary() {
    if (!receiptRef.current) return;

    try {
      setExportMessage("Preparing image...");
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#111720",
      });
      const link = document.createElement("a");

      link.download = createExportFilename(bill);
      link.href = dataUrl;
      link.click();
      setExportMessage("Summary image exported.");
    } catch {
      setExportMessage("Could not export the summary image. Please try again.");
    }
  }

  function toggleBreakdown(personId: string) {
    setExpandedPeople((current) => ({
      ...current,
      [personId]: !current[personId],
    }));
  }

  return (
    <Card className="border-primary/30 bg-card/95 shadow-2xl shadow-black/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Receipt</CardTitle>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            {formatPeso(calculation.grandTotal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isSharedBill ? (
          <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-teal-100">
            Viewing a bill from a shared link. It will not replace your saved
            bill unless you save it.
          </div>
        ) : null}

        <div
          ref={receiptRef}
          className="overflow-hidden rounded-xl border border-primary/25 bg-[#111720] text-slate-50 shadow-inner"
        >
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <p className="text-xs font-semibold uppercase">Bill Barkada</p>
            <h2 className="mt-1 text-xl font-semibold">
              {bill.title.trim() || "Untitled bill"}
            </h2>
            <p className="mt-1 text-sm opacity-80">
              {bill.date ? formatDisplayDate(bill.date) : "No date"}
            </p>
          </div>

          <div className="space-y-5 p-5">
            <section>
              <h3 className="text-xs font-semibold uppercase text-primary">
                Per-person totals
              </h3>
              <div className="mt-3 space-y-3">
                {calculation.personTotals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add people and items to see the split.
                  </p>
                ) : (
                  calculation.personTotals.map((person) => {
                    const expanded = expandedPeople[person.personId] ?? false;

                    return (
                      <div
                        key={person.personId}
                        className="rounded-lg border border-white/10 bg-background/50 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{person.name}</p>
                            <button
                              type="button"
                              onClick={() => toggleBreakdown(person.personId)}
                              className="mt-1 text-left text-xs font-medium text-primary hover:text-amber-300"
                            >
                              {expanded ? "Hide breakdown" : "Show breakdown"}
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              {formatPeso(person.total)}
                            </p>
                            <button
                              type="button"
                              onClick={() => onTogglePayment(person.personId)}
                              className="mt-1 text-xs uppercase text-muted-foreground hover:text-primary"
                            >
                              {person.paymentStatus === "paid"
                                ? "Paid"
                                : "Unpaid"}
                            </button>
                          </div>
                        </div>

                        {expanded ? (
                          <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs text-muted-foreground">
                            {person.itemShares.length === 0 ? (
                              <p>No assigned items.</p>
                            ) : (
                              person.itemShares.map((item) => (
                                <SummaryLine
                                  key={item.itemId}
                                  label={`${item.itemName} / ${item.sharedWithCount}`}
                                  value={item.share}
                                />
                              ))
                            )}
                            <SummaryLine
                              label="Service charge share"
                              value={person.serviceCharge}
                            />
                            <SummaryLine
                              label="Tip share"
                              value={person.tipShare}
                            />
                            <SummaryLine
                              label="Discount share"
                              value={-person.discountShare}
                            />
                            <SummaryLine label="Final total" value={person.total} />
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-xs font-semibold uppercase text-primary">
                Settlement
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                {!bill.paidById ? (
                  <p className="text-muted-foreground">
                    Select who paid the bill to see who should pay them back.
                  </p>
                ) : calculation.settlementLines.length === 0 ? (
                  <p className="text-muted-foreground">
                    No unpaid settlement lines.
                  </p>
                ) : (
                  calculation.settlementLines.map((line) => (
                    <p key={line.fromPersonId}>
                      {line.fromName} should pay {line.toName}{" "}
                      <span className="font-semibold text-primary">
                        {formatPeso(line.amount)}
                      </span>
                    </p>
                  ))
                )}
              </div>
            </section>

            <Separator />

            <section className="space-y-2 text-sm">
              <SummaryLine label="Subtotal" value={calculation.subtotal} />
              <SummaryLine
                label="Service Charge"
                value={calculation.serviceCharge}
              />
              <SummaryLine label="Tip" value={calculation.tip} />
              <SummaryLine label="Discount" value={-calculation.discount} />
              <div className="mt-3 flex justify-between rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground">
                <span>Grand Total</span>
                <span>{formatPeso(calculation.grandTotal)}</span>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            onClick={onCopy}
            disabled={calculation.personTotals.length === 0}
            className="h-11 font-semibold"
          >
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
          <Button
            onClick={exportSummary}
            disabled={calculation.personTotals.length === 0}
            variant="outline"
            className="h-11"
          >
            Export Summary
          </Button>
          <Button onClick={onCreateShareLink} variant="outline" className="h-11">
            Create Share Link
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="h-11 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            Reset Bill
          </Button>
        </div>

        {exportMessage || shareLinkMessage ? (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {exportMessage ? <p>{exportMessage}</p> : null}
            {shareLinkMessage ? <p>{shareLinkMessage}</p> : null}
          </div>
        ) : null}

        <CheckBill warnings={calculation.warnings} />
      </CardContent>
    </Card>
  );
}

function CheckBill({ warnings }: { warnings: BillCalculation["warnings"] }) {
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-background/45 p-4">
      <h3 className="text-sm font-semibold">Check bill</h3>
      {warnings.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No warnings. This bill looks ready to share.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {warnings.map((warning) => (
            <li key={`${warning.type}-${warning.message}`}>{warning.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span>{formatPeso(value)}</span>
    </div>
  );
}

function formatDisplayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function createExportFilename(bill: BillState): string {
  const name = bill.title.trim() || "bill-barkada-summary";

  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
}
