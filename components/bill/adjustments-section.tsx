import { Button } from "@/components/ui/button";
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

export function AdjustmentsSection({
  bill,
  onChange,
  onTipModeChange,
}: {
  bill: BillState;
  onChange: (update: BillUpdate) => void;
  onTipModeChange: (mode: BillState["tipMode"]) => void;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Service charge %" id="service-charge">
            <Input
              id="service-charge"
              type="number"
              min="0"
              value={bill.serviceChargePercent}
              onChange={(event) =>
                onChange({ serviceChargePercent: Number(event.target.value) })
              }
              className="h-11 bg-background/70"
            />
          </Field>

          <Field label="Discount amount" id="discount-amount">
            <Input
              id="discount-amount"
              type="number"
              min="0"
              value={bill.discountAmount}
              onChange={(event) =>
                onChange({ discountAmount: Number(event.target.value) })
              }
              className="h-11 bg-background/70"
            />
          </Field>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-background/45 p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => onTipModeChange("amount")}
              variant={bill.tipMode === "amount" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              Fixed Tip
            </Button>
            <Button
              type="button"
              onClick={() => onTipModeChange("percent")}
              variant={bill.tipMode === "percent" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              Tip %
            </Button>
          </div>

          {bill.tipMode === "amount" ? (
            <Field label="Tip amount" id="tip-amount">
              <Input
                id="tip-amount"
                type="number"
                min="0"
                value={bill.tipAmount}
                onChange={(event) =>
                  onChange({
                    tipAmount: Number(event.target.value),
                    tipPercent: 0,
                  })
                }
                className="h-11 bg-background/70"
              />
            </Field>
          ) : (
            <Field label="Tip percentage" id="tip-percent">
              <Input
                id="tip-percent"
                type="number"
                min="0"
                value={bill.tipPercent}
                onChange={(event) =>
                  onChange({
                    tipPercent: Number(event.target.value),
                    tipAmount: 0,
                  })
                }
                className="h-11 bg-background/70"
              />
            </Field>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
