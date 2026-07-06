"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdjustmentsSection,
  BillDetailsSection,
  HistorySection,
  ItemsSection,
  PeopleSection,
  SettlementSection,
  StatTile,
  SummarySection,
} from "@/components/bill";
import { calculateBill, createShareText } from "@/lib/bill-calculator";
import {
  clearBillHistory,
  clearBillState,
  deleteSavedBill,
  loadBillHistory,
  loadBillState,
  saveBillState,
  saveBillToHistory,
} from "@/lib/storage";
import type {
  BillItem,
  BillState,
  PaymentStatus,
  Person,
  SavedBill,
} from "@/lib/types";

const emptyBill: BillState = {
  title: "",
  date: "",
  paidById: "",
  people: [],
  items: [],
  serviceChargePercent: 0,
  tipMode: "amount",
  tipAmount: 0,
  tipPercent: 0,
  discountAmount: 0,
  paymentStatuses: {},
};

export default function Home() {
  const [bill, setBill] = useState<BillState>(emptyBill);
  const [history, setHistory] = useState<SavedBill[]>([]);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [personName, setPersonName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");

  const calculation = useMemo(() => calculateBill(bill), [bill]);
  const payer = bill.people.find((person) => person.id === bill.paidById);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = loadBillState();

      if (saved) setBill(saved);
      setHistory(loadBillHistory());
      setIsStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;

    saveBillState(bill);
  }, [bill, isStorageReady]);

  function updateBillDetails(update: Partial<BillState>) {
    setBill((current) => ({ ...current, ...update }));
  }

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
      paymentStatuses: {
        ...current.paymentStatuses,
        [newPerson.id]: "unpaid",
      },
    }));

    setPersonName("");
  }

  function removePerson(personId: string) {
    setBill((current) => {
      const paymentStatuses = { ...current.paymentStatuses };

      delete paymentStatuses[personId];

      return {
        ...current,
        paidById: current.paidById === personId ? "" : current.paidById,
        people: current.people.filter((person) => person.id !== personId),
        items: current.items.map((item) => ({
          ...item,
          sharedBy: item.sharedBy.filter((id) => id !== personId),
        })),
        paymentStatuses,
      };
    });
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

  function setTipMode(tipMode: BillState["tipMode"]) {
    setBill((current) => ({
      ...current,
      tipMode,
      tipAmount: tipMode === "amount" ? current.tipAmount : 0,
      tipPercent: tipMode === "percent" ? current.tipPercent : 0,
    }));
  }

  function togglePaymentStatus(personId: string) {
    setBill((current) => {
      const currentStatus = current.paymentStatuses[personId] ?? "unpaid";
      const nextStatus: PaymentStatus =
        currentStatus === "paid" ? "unpaid" : "paid";

      return {
        ...current,
        paymentStatuses: {
          ...current.paymentStatuses,
          [personId]: nextStatus,
        },
      };
    });
  }

  async function copySummary() {
    await navigator.clipboard.writeText(createShareText(bill, calculation));
    setCopied(true);

    setTimeout(() => setCopied(false), 1800);
  }

  function resetBill() {
    setBill(emptyBill);
    clearBillState();
  }

  function saveCurrentBill() {
    const saved = saveBillToHistory(bill);

    setHistory(loadBillHistory());
    setHistoryMessage(`Saved ${saved.title || "Untitled bill"}.`);
  }

  function loadSavedBill(savedBill: SavedBill) {
    setBill({
      title: savedBill.title,
      date: savedBill.date,
      paidById: savedBill.paidById,
      people: savedBill.people,
      items: savedBill.items,
      serviceChargePercent: savedBill.serviceChargePercent,
      tipMode: savedBill.tipMode,
      tipAmount: savedBill.tipAmount,
      tipPercent: savedBill.tipPercent,
      discountAmount: savedBill.discountAmount,
      paymentStatuses: savedBill.paymentStatuses,
    });
    setHistoryMessage(`Loaded ${savedBill.title || "Untitled bill"}.`);
  }

  function removeSavedBill(id: string) {
    deleteSavedBill(id);
    setHistory(loadBillHistory());
    setHistoryMessage("Saved bill deleted.");
  }

  function removeAllSavedBills() {
    clearBillHistory();
    setHistory([]);
    setHistoryMessage("Bill history cleared.");
  }

  return (
    <main className="barkada-shell min-h-screen text-foreground">
      <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Bill Barkada V2
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
              Split the receipt, track who paid, and send one clean group chat
              summary.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Built for real table math: tips, discounts, payment status,
              settlements, and local bill history.
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 md:w-72">
            <StatTile label="People" value={bill.people.length.toString()} />
            <StatTile label="Items" value={bill.items.length.toString()} />
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-semibold text-primary">Tip:</span> Tap names on
          an item to choose who shared it. Mark people paid once they settle up.
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <BillDetailsSection bill={bill} onChange={updateBillDetails} />

            <PeopleSection
              people={bill.people}
              personName={personName}
              onPersonNameChange={setPersonName}
              onAddPerson={addPerson}
              onRemovePerson={removePerson}
            />

            <ItemsSection
              people={bill.people}
              items={bill.items}
              itemName={itemName}
              itemPrice={itemPrice}
              onItemNameChange={setItemName}
              onItemPriceChange={setItemPrice}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onTogglePerson={togglePersonForItem}
            />

            <AdjustmentsSection
              bill={bill}
              onChange={updateBillDetails}
              onTipModeChange={setTipMode}
            />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <SummarySection
              grandTotal={calculation.grandTotal}
              personTotals={calculation.personTotals}
              subtotal={calculation.subtotal}
              serviceCharge={calculation.serviceCharge}
              tip={calculation.tip}
              discount={calculation.discount}
              copied={copied}
              onTogglePayment={togglePaymentStatus}
              onCopy={copySummary}
              onReset={resetBill}
            />

            <SettlementSection
              payerName={payer?.name}
              lines={calculation.settlementLines}
            />

            <HistorySection
              history={history}
              message={historyMessage}
              onSave={saveCurrentBill}
              onLoad={loadSavedBill}
              onDelete={removeSavedBill}
              onClear={removeAllSavedBills}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
