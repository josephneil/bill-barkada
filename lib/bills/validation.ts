import { z } from "zod";
import { calculateBill } from "@/lib/bill-calculator";
import type { BillState } from "@/lib/types";

const paymentStatusSchema = z.enum(["paid", "unpaid"]);

const personSchema = z.object({
  id: z.string().min(1, "Person id is required."),
  name: z.string().trim().min(1, "Person name is required."),
});

const itemSchema = z.object({
  id: z.string().min(1, "Item id is required."),
  name: z.string().trim().min(1, "Item name is required."),
  price: z.number().positive("Item prices must be greater than 0."),
  sharedBy: z.array(z.string()).min(1, "Every item needs at least one sharer."),
});

const billStateSchema = z
  .object({
    title: z.string().trim().min(1, "Bill title is required."),
    date: z.string(),
    paidById: z.string(),
    people: z.array(personSchema).min(1, "Add at least one person."),
    items: z.array(itemSchema),
    serviceChargePercent: z
      .number()
      .min(0, "Service charge cannot be negative."),
    tipMode: z.enum(["amount", "percent"]),
    tipAmount: z.number().min(0, "Tip amount cannot be negative."),
    tipPercent: z.number().min(0, "Tip percent cannot be negative."),
    discountAmount: z.number().min(0, "Discount cannot be negative."),
    paymentStatuses: z.record(z.string(), paymentStatusSchema),
  })
  .superRefine((state, context) => {
    const personIds = new Set(state.people.map((person) => person.id));

    if (state.date && Number.isNaN(new Date(`${state.date}T00:00:00`).getTime())) {
      context.addIssue({
        code: "custom",
        message: "Bill date is invalid.",
        path: ["date"],
      });
    }

    if (state.paidById && !personIds.has(state.paidById)) {
      context.addIssue({
        code: "custom",
        message: "Paid by must be one of the current people.",
        path: ["paidById"],
      });
    }

    for (const [itemIndex, item] of state.items.entries()) {
      for (const personId of item.sharedBy) {
        if (!personIds.has(personId)) {
          context.addIssue({
            code: "custom",
            message: "Item sharers must be current people.",
            path: ["items", itemIndex, "sharedBy"],
          });
        }
      }
    }

    const calculation = calculateBill(state);

    if (
      state.discountAmount >
      calculation.subtotal + calculation.serviceCharge + calculation.tip
    ) {
      context.addIssue({
        code: "custom",
        message: "Discount cannot make the grand total negative.",
        path: ["discountAmount"],
      });
    }
  });

export function parseBillForCloud(value: unknown): BillState {
  return billStateSchema.parse(value);
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
