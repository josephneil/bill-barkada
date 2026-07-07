import type {
  BillCalculation,
  BillWarning,
  BillState,
  PersonItemShare,
  PersonTotal,
  SettlementLine,
} from "./types";

export function calculateBill(state: BillState): BillCalculation {
  const subtotal = state.items.reduce(
    (sum, item) => sum + safeNumber(item.price),
    0,
  );

  const baseTotals = new Map<string, number>();
  const itemShares = new Map<string, PersonItemShare[]>();

  for (const person of state.people) {
    baseTotals.set(person.id, 0);
    itemShares.set(person.id, []);
  }

  for (const item of state.items) {
    if (item.sharedBy.length === 0) continue;

    const share = safeNumber(item.price) / item.sharedBy.length;

    for (const personId of item.sharedBy) {
      baseTotals.set(personId, (baseTotals.get(personId) ?? 0) + share);
      itemShares.get(personId)?.push({
        itemId: item.id,
        itemName: item.name,
        itemPrice: roundMoney(item.price),
        sharedWithCount: item.sharedBy.length,
        share: roundMoney(share),
      });
    }
  }

  const serviceCharge =
    subtotal * (safeNumber(state.serviceChargePercent) / 100);
  const tip =
    state.tipMode === "percent"
      ? subtotal * (safeNumber(state.tipPercent) / 100)
      : safeNumber(state.tipAmount);
  const discount = Math.min(
    safeNumber(state.discountAmount),
    subtotal + serviceCharge + tip,
  );
  const grandTotal = subtotal + serviceCharge + tip - discount;

  const personTotals: PersonTotal[] = state.people.map((person) => {
    const personSubtotal = baseTotals.get(person.id) ?? 0;
    const ratio = subtotal > 0 ? personSubtotal / subtotal : 0;

    const personServiceCharge = serviceCharge * ratio;
    const personTipShare = tip * ratio;
    const personDiscountShare = discount * ratio;
    const total =
      personSubtotal + personServiceCharge + personTipShare - personDiscountShare;

    return {
      personId: person.id,
      name: person.name,
      subtotal: roundMoney(personSubtotal),
      itemShares: itemShares.get(person.id) ?? [],
      serviceCharge: roundMoney(personServiceCharge),
      tipShare: roundMoney(personTipShare),
      discountShare: roundMoney(personDiscountShare),
      total: roundMoney(total),
      paymentStatus: state.paymentStatuses[person.id] ?? "unpaid",
    };
  });

  return {
    subtotal: roundMoney(subtotal),
    serviceCharge: roundMoney(serviceCharge),
    tip: roundMoney(tip),
    discount: roundMoney(discount),
    grandTotal: roundMoney(grandTotal),
    personTotals,
    settlementLines: createSettlementLines(state, personTotals),
    warnings: createBillWarnings(state, personTotals, {
      subtotal,
      serviceCharge,
      tip,
    }),
  };
}

export function formatPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export function createShareText(
  state: BillState,
  calculation: BillCalculation,
): string {
  const payer = state.people.find((person) => person.id === state.paidById);
  const lines = [
    "\u{1F37D}\uFE0F Bill Barkada",
    state.title.trim(),
    state.date ? formatDisplayDate(state.date) : "",
    "",
    ...calculation.personTotals.map(
      (person) =>
        `${person.name}: ${formatPeso(person.total)} - ${statusLabel(
          person.paymentStatus,
        )}`,
    ),
    "",
    ...(payer
      ? [
          `Pay ${payer.name}:`,
          ...calculation.settlementLines.map(
            (line) =>
              `${line.fromName} should pay ${line.toName} ${formatPeso(
                line.amount,
              )}`,
          ),
          "",
        ]
      : []),
    `Subtotal: ${formatPeso(calculation.subtotal)}`,
    `Service Charge: ${formatPeso(calculation.serviceCharge)}`,
    `Tip: ${formatPeso(calculation.tip)}`,
    `Discount: ${formatPeso(calculation.discount)}`,
    `Total: ${formatPeso(calculation.grandTotal)}`,
  ];

  return compactBlankLines(lines).join("\n");
}

function createSettlementLines(
  state: BillState,
  personTotals: PersonTotal[],
): SettlementLine[] {
  const payer = state.people.find((person) => person.id === state.paidById);

  if (!payer) return [];

  return personTotals
    .filter(
      (person) =>
        person.personId !== payer.id &&
        person.paymentStatus !== "paid" &&
        person.total > 0,
    )
    .map((person) => ({
      fromPersonId: person.personId,
      fromName: person.name,
      toPersonId: payer.id,
      toName: payer.name,
      amount: roundMoney(person.total),
    }));
}

function createBillWarnings(
  state: BillState,
  personTotals: PersonTotal[],
  totals: {
    subtotal: number;
    serviceCharge: number;
    tip: number;
  },
): BillWarning[] {
  const warnings: BillWarning[] = [];
  const adjustmentTotal = totals.subtotal + totals.serviceCharge + totals.tip;

  if (!state.title.trim()) {
    warnings.push({
      type: "empty-title",
      message: "Add a bill title so the summary is easy to recognize.",
    });
  }

  for (const item of state.items) {
    if (item.sharedBy.length === 0) {
      warnings.push({
        type: "unassigned-item",
        message: `${item.name || "An item"} has no assigned people.`,
      });
    }
  }

  for (const person of personTotals) {
    if (person.itemShares.length === 0) {
      warnings.push({
        type: "person-without-items",
        message: `${person.name} has no assigned items.`,
      });
    }
  }

  if (safeNumber(state.discountAmount) > adjustmentTotal) {
    warnings.push({
      type: "discount-too-large",
      message:
        "Discount is larger than subtotal, service charge, and tip, so the total is capped at zero.",
    });
  }

  if (!state.paidById && personTotals.some((person) => person.total > 0)) {
    warnings.push({
      type: "missing-payer",
      message: "Select who paid to generate settlement lines.",
    });
  }

  return warnings;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function statusLabel(status: string): string {
  return status === "paid" ? "Paid" : "Unpaid";
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

function compactBlankLines(lines: string[]): string[] {
  return lines.reduce<string[]>((result, line) => {
    const previous = result.at(-1);

    if (!line && !previous) return result;

    result.push(line);
    return result;
  }, []);
}
