import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BillState } from "@/lib/types";
import { Field } from "./field";

type BillUpdate = Partial<BillState>;

export function BillDetailsSection({
  bill,
  onChange,
}: {
  bill: BillState;
  onChange: (update: BillUpdate) => void;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">Bill Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <Field label="Bill title" id="bill-title">
            <Input
              id="bill-title"
              value={bill.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Dinner at IT Park"
              className="h-11 bg-background/70"
            />
          </Field>

          <Field label="Bill date" id="bill-date">
            <Input
              id="bill-date"
              value={bill.date}
              onChange={(event) => onChange({ date: event.target.value })}
              type="date"
              className="h-11 bg-background/70"
            />
          </Field>

          <Field label="Paid by" id="paid-by">
            <select
              id="paid-by"
              value={bill.paidById}
              onChange={(event) => onChange({ paidById: event.target.value })}
              className="h-11 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">No payer yet</option>
              {bill.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
