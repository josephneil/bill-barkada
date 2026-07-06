import type { BillState, PaymentStatus, SavedBill, TipMode } from "./types";

const STORAGE_KEY = "bill-barkada:v2";
const LEGACY_STORAGE_KEY = "bill-barkada:v1";
const HISTORY_KEY = "bill-barkada:history:v1";

export function saveBillState(state: BillState) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeBillState(state)));
}

export function loadBillState(): BillState | null {
  if (typeof window === "undefined") return null;

  const saved =
    localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!saved) return null;

  try {
    return normalizeBillState(JSON.parse(saved));
  } catch {
    return null;
  }
}

export function clearBillState() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function loadBillHistory(): SavedBill[] {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem(HISTORY_KEY);

  if (!saved) return [];

  try {
    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeSavedBill).filter(isSavedBill);
  } catch {
    return [];
  }
}

export function saveBillToHistory(state: BillState): SavedBill {
  const history = loadBillHistory();
  const now = new Date().toISOString();
  const savedBill: SavedBill = {
    ...normalizeBillState(state),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  saveBillHistory([savedBill, ...history]);

  return savedBill;
}

export function deleteSavedBill(id: string) {
  saveBillHistory(loadBillHistory().filter((bill) => bill.id !== id));
}

export function clearBillHistory() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(HISTORY_KEY);
}

function saveBillHistory(history: SavedBill[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function normalizeSavedBill(value: unknown): SavedBill | null {
  if (!isRecord(value)) return null;

  const state = normalizeBillState(value);
  const id = getString(value.id) || crypto.randomUUID();
  const createdAt = getString(value.createdAt) || new Date().toISOString();
  const updatedAt = getString(value.updatedAt) || createdAt;

  return {
    ...state,
    id,
    createdAt,
    updatedAt,
  };
}

function normalizeBillState(value: unknown): BillState {
  const source = isRecord(value) ? value : {};
  const people = Array.isArray(source.people) ? source.people : [];
  const personIds = new Set(
    people
      .filter(isRecord)
      .map((person) => getString(person.id))
      .filter(Boolean),
  );
  const paidById = getString(source.paidById);

  return {
    title: getString(source.title),
    date: getString(source.date),
    paidById: personIds.has(paidById) ? paidById : "",
    people: people.filter(isRecord).map((person) => ({
      id: getString(person.id),
      name: getString(person.name),
    })),
    items: normalizeItems(source.items, personIds),
    serviceChargePercent: getNumber(source.serviceChargePercent),
    tipMode: getTipMode(source.tipMode),
    tipAmount: getNumber(source.tipAmount),
    tipPercent: getNumber(source.tipPercent),
    discountAmount: getNumber(source.discountAmount),
    paymentStatuses: normalizePaymentStatuses(source.paymentStatuses, personIds),
  };
}

function normalizeItems(value: unknown, personIds: Set<string>) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    id: getString(item.id),
    name: getString(item.name),
    price: getNumber(item.price),
    sharedBy: Array.isArray(item.sharedBy)
      ? item.sharedBy
          .map(getString)
          .filter((personId) => personIds.has(personId))
      : [],
  }));
}

function normalizePaymentStatuses(
  value: unknown,
  personIds: Set<string>,
): Record<string, PaymentStatus> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([personId, status]) =>
          personIds.has(personId) && (status === "paid" || status === "unpaid"),
      )
      .map(([personId, status]) => [personId, status as PaymentStatus]),
  );
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function getTipMode(value: unknown): TipMode {
  return value === "percent" ? "percent" : "amount";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSavedBill(value: SavedBill | null): value is SavedBill {
  return value !== null;
}
