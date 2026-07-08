"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdjustmentsSection,
  BillDetailsSection,
  HistorySection,
  ItemsSection,
  OnlineActionsSection,
  PeopleSection,
  ReceiptSummaryCard,
  StatTile,
} from "@/components/bill";
import { calculateBill, createShareText } from "@/lib/bill-calculator";
import { duplicateBillForLocal } from "@/lib/bills/duplicate";
import {
  createShareUrl,
  loadSharedBillFromUrl,
  SHARE_PARAM,
} from "@/lib/share-link";
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

export const emptyBill: BillState = {
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

type CloudEditConfig = {
  shareId: string;
  token: string;
};

type OnlineSaveResponse = {
  bill?: BillState;
  viewLink?: string;
  editLink?: string;
  error?: string;
};

export function BillEditor({
  initialBill,
  cloudEdit,
}: {
  initialBill?: BillState;
  cloudEdit?: CloudEditConfig;
}) {
  const [bill, setBill] = useState<BillState>(initialBill ?? emptyBill);
  const [history, setHistory] = useState<SavedBill[]>([]);
  const [isStorageReady, setIsStorageReady] = useState(Boolean(initialBill));
  const [personName, setPersonName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");
  const [shareLinkMessage, setShareLinkMessage] = useState("");
  const [isSharedBill, setIsSharedBill] = useState(Boolean(initialBill));
  const [isSavingOnline, setIsSavingOnline] = useState(false);
  const [onlineMessage, setOnlineMessage] = useState("");
  const [viewLink, setViewLink] = useState(
    cloudEdit && typeof window !== "undefined"
      ? `${window.location.origin}/b/${cloudEdit.shareId}`
      : "",
  );
  const [editLink, setEditLink] = useState(
    cloudEdit && typeof window !== "undefined"
      ? `${window.location.origin}/b/${cloudEdit.shareId}/edit?token=${cloudEdit.token}`
      : "",
  );

  const calculation = useMemo(() => calculateBill(bill), [bill]);
  const isCloudEdit = Boolean(cloudEdit);

  useEffect(() => {
    if (initialBill) {
      queueMicrotask(() => {
        setHistory(loadBillHistory());
      });
      return;
    }

    queueMicrotask(() => {
      const hasSharedBillParam = new URL(window.location.href).searchParams.has(
        SHARE_PARAM,
      );
      const sharedBill = loadSharedBillFromUrl(window.location.href);
      const saved = loadBillState();

      if (sharedBill) {
        setBill(sharedBill);
        setIsSharedBill(true);
        setShareLinkMessage("Loaded bill from shared link.");
      } else if (hasSharedBillParam) {
        setShareLinkMessage("Shared link could not be loaded.");
        if (saved) setBill(saved);
      } else if (saved) {
        setBill(saved);
      }

      setHistory(loadBillHistory());
      setIsStorageReady(true);
    });
  }, [initialBill]);

  useEffect(() => {
    if (!isStorageReady || isSharedBill || isCloudEdit) return;

    saveBillState(bill);
  }, [bill, isCloudEdit, isSharedBill, isStorageReady]);

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
    setIsSharedBill(false);
    setShareLinkMessage("");
    clearBillState();
  }

  function saveCurrentBill() {
    const saved = saveBillToHistory(bill);

    setHistory(loadBillHistory());
    setIsSharedBill(false);
    setHistoryMessage(`Saved ${saved.title || "Untitled bill"}.`);
  }

  function loadSavedBill(savedBill: SavedBill) {
    setBill(toBillState(savedBill));
    setIsSharedBill(false);
    setShareLinkMessage("");
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

  async function createEncodedShareLink() {
    try {
      const shareUrl = createShareUrl(bill, window.location.href);

      await navigator.clipboard.writeText(shareUrl);
      setShareLinkMessage("Share link copied.");
    } catch {
      setShareLinkMessage("Could not create a share link. Please try again.");
    }
  }

  async function saveOnline() {
    setIsSavingOnline(true);
    setOnlineMessage("");

    try {
      const endpoint = cloudEdit
        ? `/api/bills/${cloudEdit.shareId}?token=${cloudEdit.token}`
        : "/api/bills";
      const response = await fetch(endpoint, {
        method: cloudEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
      });
      const data = (await response.json()) as OnlineSaveResponse;

      if (!response.ok) {
        throw new Error(data.error || "Could not save online.");
      }

      if (data.bill) setBill(data.bill);

      if (cloudEdit) {
        const origin = window.location.origin;

        setViewLink(`${origin}/b/${cloudEdit.shareId}`);
        setEditLink(
          `${origin}/b/${cloudEdit.shareId}/edit?token=${cloudEdit.token}`,
        );
        setOnlineMessage("Online bill updated.");
      } else {
        setViewLink(data.viewLink ?? "");
        setEditLink(data.editLink ?? "");
        setOnlineMessage("Online bill saved.");
      }
    } catch (error) {
      setOnlineMessage(
        error instanceof Error ? error.message : "Could not save online.",
      );
    } finally {
      setIsSavingOnline(false);
    }
  }

  async function copyViewLink() {
    if (!viewLink) return;

    await navigator.clipboard.writeText(viewLink);
    setOnlineMessage("View link copied.");
  }

  async function copyEditLink() {
    if (!editLink) return;

    await navigator.clipboard.writeText(editLink);
    setOnlineMessage("Edit link copied.");
  }

  function duplicateBill() {
    const duplicate = duplicateBillForLocal(bill);

    saveBillState(duplicate);
    window.location.href = "/";
  }

  return (
    <main className="barkada-shell min-h-screen text-foreground">
      <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Bill Barkada V4
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
              Split, save, and share group bills without losing the table math.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Built for real group meals: receipt summaries, cloud persistence,
              edit links, payment status, settlements, and local history.
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 md:w-72">
            <StatTile label="People" value={bill.people.length.toString()} />
            <StatTile label="Items" value={bill.items.length.toString()} />
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-semibold text-primary">Tip:</span> Tap names on
          an item to choose who shared it. Save online when you want a public
          view link and a secret edit link.
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
            <ReceiptSummaryCard
              bill={bill}
              calculation={calculation}
              copied={copied}
              shareLinkMessage={shareLinkMessage}
              isSharedBill={isSharedBill}
              onTogglePayment={togglePaymentStatus}
              onCopy={copySummary}
              onCreateShareLink={createEncodedShareLink}
              onReset={resetBill}
            />

            <OnlineActionsSection
              isSaving={isSavingOnline}
              message={onlineMessage}
              viewLink={viewLink}
              editLink={editLink}
              onSaveOnline={saveOnline}
              onCopyViewLink={copyViewLink}
              onCopyEditLink={copyEditLink}
              onDuplicate={duplicateBill}
            />

            {!isCloudEdit ? (
              <HistorySection
                history={history}
                message={historyMessage}
                onSave={saveCurrentBill}
                onLoad={loadSavedBill}
                onDelete={removeSavedBill}
                onClear={removeAllSavedBills}
              />
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}

function toBillState(savedBill: SavedBill): BillState {
  return {
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
  };
}
