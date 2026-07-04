"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  calculateBill,
  createShareText,
  formatPeso,
} from "@/lib/bill-calculator";
import { clearBillState, loadBillState, saveBillState } from "@/lib/storage";
import type { BillItem, BillState, Person } from "@/lib/types";

const emptyBill: BillState = {
  people: [],
  items: [],
  serviceChargePercent: 0,
  discountAmount: 0,
};

export default function Home() {
  const [bill, setBill] = useState<BillState>(emptyBill);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [personName, setPersonName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [copied, setCopied] = useState(false);

  const calculation = useMemo(() => calculateBill(bill), [bill]);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = loadBillState();

      if (saved) setBill(saved);
      setIsStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;

    saveBillState(bill);
  }, [bill, isStorageReady]);

  function addPerson() {
    const name = personName.trim();

    if (!name) return;

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name,
    };

    setBill((current) => ({
      ...current,
      people: [...current.people, newPerson],
    }));

    setPersonName("");
  }

  function removePerson(personId: string) {
    setBill((current) => ({
      ...current,
      people: current.people.filter((person) => person.id !== personId),
      items: current.items.map((item) => ({
        ...item,
        sharedBy: item.sharedBy.filter((id) => id !== personId),
      })),
    }));
  }

  function addItem() {
    const name = itemName.trim();
    const price = Number(itemPrice);

    if (!name || !Number.isFinite(price) || price <= 0) return;

    const newItem: BillItem = {
      id: crypto.randomUUID(),
      name,
      price,
      sharedBy: bill.people.map((person) => person.id),
    };

    setBill((current) => ({
      ...current,
      items: [...current.items, newItem],
    }));

    setItemName("");
    setItemPrice("");
  }

  function removeItem(itemId: string) {
    setBill((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  }

  function togglePersonForItem(itemId: string, personId: string) {
    setBill((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;

        const isSelected = item.sharedBy.includes(personId);

        return {
          ...item,
          sharedBy: isSelected
            ? item.sharedBy.filter((id) => id !== personId)
            : [...item.sharedBy, personId],
        };
      }),
    }));
  }

  async function copySummary() {
    await navigator.clipboard.writeText(createShareText(calculation));
    setCopied(true);

    setTimeout(() => setCopied(false), 1800);
  }

  function resetBill() {
    setBill(emptyBill);
    clearBillState();
  }

  return (
    <main className="barkada-shell min-h-screen text-foreground">
      <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Bill Barkada
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
              Split group bills fairly, quickly, and without calculator drama.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Add people, assign shared items, include service charge or
              discount, then copy a clean payment summary for the group chat.
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 md:w-72">
            <div className="rounded-xl border bg-card/80 p-4 shadow-lg shadow-black/10">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                People
              </p>
              <p className="mt-2 text-3xl font-semibold text-primary">
                {bill.people.length}
              </p>
            </div>
            <div className="rounded-xl border bg-card/80 p-4 shadow-lg shadow-black/10">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Items
              </p>
              <p className="mt-2 text-3xl font-semibold text-primary">
                {bill.items.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-semibold text-primary">Tip:</span> Tap names on
          an item to choose who shared it.
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">People</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    value={personName}
                    onChange={(event) => setPersonName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addPerson();
                    }}
                    placeholder="Name, e.g. Joseph"
                    className="h-11 min-w-0 flex-1 bg-background/70"
                  />
                  <Button onClick={addPerson} className="h-11 px-5 font-semibold">
                    Add
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {bill.people.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add your barkada first.
                    </p>
                  ) : (
                    bill.people.map((person) => (
                      <Button
                        key={person.id}
                        onClick={() => removePerson(person.id)}
                        variant="outline"
                        size="sm"
                        className="rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                        title="Click to remove"
                      >
                        {person.name} x
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                  <Input
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    placeholder="Item, e.g. Pizza"
                    className="h-11 bg-background/70"
                  />
                  <Input
                    value={itemPrice}
                    onChange={(event) => setItemPrice(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addItem();
                    }}
                    type="number"
                    min="0"
                    placeholder="Price"
                    className="h-11 bg-background/70"
                  />
                  <Button onClick={addItem} className="h-11 px-5 font-semibold">
                    Add Item
                  </Button>
                </div>

                <div className="mt-5 space-y-4">
                  {bill.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add food, drinks, or anything from the receipt.
                    </p>
                  ) : (
                    bill.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-background/45 p-4 shadow-lg shadow-black/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="mt-1 text-sm font-medium text-primary">
                              {formatPeso(item.price)}
                            </p>
                          </div>

                          <Button
                            onClick={() => removeItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="mt-4">
                          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Shared by
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {bill.people.map((person) => {
                              const selected = item.sharedBy.includes(
                                person.id,
                              );

                              return (
                                <Button
                                  key={person.id}
                                  onClick={() =>
                                    togglePersonForItem(item.id, person.id)
                                  }
                                  variant={selected ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    selected
                                      ? "rounded-full font-semibold"
                                      : "rounded-full bg-background/60"
                                  }
                                >
                                  {person.name}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="service-charge">Service charge %</Label>
                    <Input
                      id="service-charge"
                      type="number"
                      min="0"
                      value={bill.serviceChargePercent}
                      onChange={(event) =>
                        setBill((current) => ({
                          ...current,
                          serviceChargePercent: Number(event.target.value),
                        }))
                      }
                      className="h-11 bg-background/70"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discount-amount">Discount amount</Label>
                    <Input
                      id="discount-amount"
                      type="number"
                      min="0"
                      value={bill.discountAmount}
                      onChange={(event) =>
                        setBill((current) => ({
                          ...current,
                          discountAmount: Number(event.target.value),
                        }))
                      }
                      className="h-11 bg-background/70"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="border-primary/30 bg-card/95 shadow-2xl shadow-black/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg">Summary</CardTitle>
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    {formatPeso(calculation.grandTotal)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calculation.personTotals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add people and items to see the split.
                    </p>
                  ) : (
                    calculation.personTotals.map((person) => (
                      <div
                        key={person.personId}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-background/50 px-4 py-3"
                      >
                        <span className="font-medium">{person.name}</span>
                        <Badge className="font-semibold">
                          {formatPeso(person.total)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="my-5" />

                <div className="space-y-2 text-sm">
                  <SummaryRow label="Subtotal" value={calculation.subtotal} />
                  <SummaryRow
                    label="Service Charge"
                    value={calculation.serviceCharge}
                  />
                  <SummaryRow label="Discount" value={calculation.discount} />
                  <div className="mt-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>{formatPeso(calculation.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <Button
                    onClick={copySummary}
                    disabled={calculation.personTotals.length === 0}
                    className="h-11 font-semibold"
                  >
                    {copied ? "Copied!" : "Copy Summary"}
                  </Button>

                  <Button
                    onClick={resetBill}
                    variant="outline"
                    className="h-11 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                  >
                    Reset Bill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{formatPeso(value)}</span>
    </div>
  );
}
