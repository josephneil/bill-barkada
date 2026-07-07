import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { normalizeBillState } from "./storage";
import type { BillState } from "./types";

export const SHARE_PARAM = "bill";

export function createShareUrl(state: BillState, href: string): string {
  const url = new URL(href);
  const encoded = encodeBillState(state);

  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

export function loadSharedBillFromUrl(href: string): BillState | null {
  const url = new URL(href);
  const encoded = url.searchParams.get(SHARE_PARAM);

  if (!encoded) return null;

  return decodeBillState(encoded);
}

function encodeBillState(state: BillState): string {
  return compressToEncodedURIComponent(JSON.stringify(normalizeBillState(state)));
}

function decodeBillState(value: string): BillState | null {
  try {
    const decompressed = decompressFromEncodedURIComponent(value);

    if (!decompressed) return null;

    return normalizeBillState(JSON.parse(decompressed));
  } catch {
    return null;
  }
}
