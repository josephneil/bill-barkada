import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SavedBill } from "@/lib/types";

export function HistorySection({
  history,
  message,
  onSave,
  onLoad,
  onDelete,
  onClear,
}: {
  history: SavedBill[];
  message: string;
  onSave: () => void;
  onLoad: (bill: SavedBill) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">Bill History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={onSave} className="h-11 font-semibold">
            Save Current Bill
          </Button>
          <Button
            onClick={onClear}
            disabled={history.length === 0}
            variant="outline"
            className="h-11 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            Clear History
          </Button>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        ) : null}

        <div className="mt-5 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Saved bills will appear here for quick reloads.
            </p>
          ) : (
            history.map((savedBill) => (
              <div
                key={savedBill.id}
                className="rounded-xl border border-white/10 bg-background/50 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {savedBill.title || "Untitled bill"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {savedBill.date || "No date"} - saved{" "}
                    {formatSavedDate(savedBill.updatedAt)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onLoad(savedBill)}
                    size="sm"
                    className="rounded-full"
                  >
                    Load
                  </Button>
                  <Button
                    onClick={() => onDelete(savedBill.id)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatSavedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
