export type Person = {
  id: string;
  name: string;
};

export type BillItem = {
  id: string;
  name: string;
  price: number;
  sharedBy: string[];
};

export type TipMode = "amount" | "percent";

export type PaymentStatus = "paid" | "unpaid";

export type BillState = {
  title: string;
  date: string;
  paidById: string;
  people: Person[];
  items: BillItem[];
  serviceChargePercent: number;
  tipMode: TipMode;
  tipAmount: number;
  tipPercent: number;
  discountAmount: number;
  paymentStatuses: Record<string, PaymentStatus>;
};

export type SavedBill = BillState & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonTotal = {
  personId: string;
  name: string;
  subtotal: number;
  serviceCharge: number;
  tipShare: number;
  discountShare: number;
  total: number;
  paymentStatus: PaymentStatus;
};

export type SettlementLine = {
  fromPersonId: string;
  fromName: string;
  toPersonId: string;
  toName: string;
  amount: number;
};

export type BillCalculation = {
  subtotal: number;
  serviceCharge: number;
  tip: number;
  discount: number;
  grandTotal: number;
  personTotals: PersonTotal[];
  settlementLines: SettlementLine[];
};
