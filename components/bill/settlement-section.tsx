import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateBill, formatPeso } from "@/lib/bill-calculator";

type SettlementLines = ReturnType<typeof calculateBill>["settlementLines"];

export function SettlementSection({
  payerName,
  lines,
}: {
  payerName?: string;
  lines: SettlementLines;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">Settlement</CardTitle>
      </CardHeader>
      <CardContent>
        {!payerName ? (
          <p className="text-sm text-muted-foreground">
            Select who paid the bill to see who should pay them back.
          </p>
        ) : lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unpaid settlements for {payerName}.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Pay {payerName}:</p>
            {lines.map((line) => (
              <div
                key={line.fromPersonId}
                className="rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-sm"
              >
                {line.fromName} should pay {line.toName}{" "}
                <span className="font-semibold text-primary">
                  {formatPeso(line.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
