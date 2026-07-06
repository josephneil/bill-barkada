import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateBill, formatPeso } from "@/lib/bill-calculator";

type PersonTotals = ReturnType<typeof calculateBill>["personTotals"];

export function SummarySection({
  grandTotal,
  personTotals,
  subtotal,
  serviceCharge,
  tip,
  discount,
  copied,
  onTogglePayment,
  onCopy,
  onReset,
}: {
  grandTotal: number;
  personTotals: PersonTotals;
  subtotal: number;
  serviceCharge: number;
  tip: number;
  discount: number;
  copied: boolean;
  onTogglePayment: (personId: string) => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  return (
    <Card className="border-primary/30 bg-card/95 shadow-2xl shadow-black/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Summary</CardTitle>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            {formatPeso(grandTotal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {personTotals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add people and items to see the split.
            </p>
          ) : (
            personTotals.map((person) => (
              <div
                key={person.personId}
                className="rounded-xl border border-white/10 bg-background/50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{person.name}</span>
                  <Badge className="font-semibold">
                    {formatPeso(person.total)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase text-muted-foreground">
                    {person.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </span>
                  <Button
                    onClick={() => onTogglePayment(person.personId)}
                    variant={
                      person.paymentStatus === "paid" ? "default" : "outline"
                    }
                    size="sm"
                    className="h-8 rounded-full"
                  >
                    Mark {person.paymentStatus === "paid" ? "Unpaid" : "Paid"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator className="my-5" />

        <div className="space-y-2 text-sm">
          <SummaryRow label="Subtotal" value={subtotal} />
          <SummaryRow label="Service Charge" value={serviceCharge} />
          <SummaryRow label="Tip" value={tip} />
          <SummaryRow label="Discount" value={discount} />
          <div className="mt-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPeso(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Button
            onClick={onCopy}
            disabled={personTotals.length === 0}
            className="h-11 font-semibold"
          >
            {copied ? "Copied!" : "Copy Summary"}
          </Button>

          <Button
            onClick={onReset}
            variant="outline"
            className="h-11 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            Reset Bill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{formatPeso(value)}</span>
    </div>
  );
}
