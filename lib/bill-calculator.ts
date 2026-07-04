import type { BillCalculation, BillState, PersonTotal } from "./types";

export function calculateBill(state: BillState): BillCalculation {
  const subtotal = state.items.reduce(
    (sum, item) => sum + safeNumber(item.price),
    0,
  );

  const baseTotals = new Map<string, number>();

  for (const person of state.people) {
    baseTotals.set(person.id, 0);
  }

  for (const item of state.items) {
    if (item.sharedBy.length === 0) continue;

    const share = safeNumber(item.price) / item.sharedBy.length;

    for (const personId of item.sharedBy) {
      baseTotals.set(personId, (baseTotals.get(personId) ?? 0) + share);
    }
  }

  const serviceCharge =
    subtotal * (safeNumber(state.serviceChargePercent) / 100);
  const discount = Math.min(
    safeNumber(state.discountAmount),
    subtotal + serviceCharge,
  );
  const grandTotal = subtotal + serviceCharge - discount;

  const personTotals: PersonTotal[] = state.people.map((person) => {
    const personSubtotal = baseTotals.get(person.id) ?? 0;
    const ratio = subtotal > 0 ? personSubtotal / subtotal : 0;

    const personServiceCharge = serviceCharge * ratio;
    const personDiscountShare = discount * ratio;
    const total = personSubtotal + personServiceCharge - personDiscountShare;

    return {
      personId: person.id,
      name: person.name,
      subtotal: roundMoney(personSubtotal),
      serviceCharge: roundMoney(personServiceCharge),
      discountShare: roundMoney(personDiscountShare),
      total: roundMoney(total),
    };
  });

  return {
    subtotal: roundMoney(subtotal),
    serviceCharge: roundMoney(serviceCharge),
    discount: roundMoney(discount),
    grandTotal: roundMoney(grandTotal),
    personTotals,
  };
}

export function formatPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export function createShareText(calculation: BillCalculation): string {
  const lines = [
    "🍽️ Bill Barkada",
    "",
    ...calculation.personTotals.map(
      (person) => `${person.name}: ${formatPeso(person.total)}`,
    ),
    "",
    `Subtotal: ${formatPeso(calculation.subtotal)}`,
    `Service Charge: ${formatPeso(calculation.serviceCharge)}`,
    `Discount: ${formatPeso(calculation.discount)}`,
    `Total: ${formatPeso(calculation.grandTotal)}`,
  ];

  return lines.join("\n");
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
