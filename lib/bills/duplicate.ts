import type { BillState } from "@/lib/types";

export function duplicateBillForLocal(state: BillState): BillState {
  const personIdMap = new Map(
    state.people.map((person) => [person.id, crypto.randomUUID()]),
  );

  return {
    ...state,
    title: state.title ? `${state.title} copy` : "",
    paidById: state.paidById ? (personIdMap.get(state.paidById) ?? "") : "",
    people: state.people.map((person) => ({
      id: personIdMap.get(person.id) ?? crypto.randomUUID(),
      name: person.name,
    })),
    items: state.items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      sharedBy: item.sharedBy
        .map((personId) => personIdMap.get(personId))
        .filter((personId): personId is string => Boolean(personId)),
    })),
    paymentStatuses: Object.fromEntries(
      state.people.map((person) => [
        personIdMap.get(person.id) ?? crypto.randomUUID(),
        "unpaid",
      ]),
    ),
  };
}
