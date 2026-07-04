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

export type BillState = {
  people: Person[];
  items: BillItem[];
  serviceChargePercent: number;
  discountAmount: number;
};

export type PersonTotal = {
  personId: string;
  name: string;
  subtotal: number;
  serviceCharge: number;
  discountShare: number;
  total: number;
};

export type BillCalculation = {
  subtotal: number;
  serviceCharge: number;
  discount: number;
  grandTotal: number;
  personTotals: PersonTotal[];
};
