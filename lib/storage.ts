import type { BillState } from "./types";

const STORAGE_KEY = "bill-barkada:v1";

export function saveBillState(state: BillState) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadBillState(): BillState | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return null;

  try {
    return JSON.parse(saved) as BillState;
  } catch {
    return null;
  }
}

export function clearBillState() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}
