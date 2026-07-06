import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPeso } from "@/lib/bill-calculator";
import type { BillItem, Person } from "@/lib/types";

export function ItemsSection({
  people,
  items,
  itemName,
  itemPrice,
  onItemNameChange,
  onItemPriceChange,
  onAddItem,
  onRemoveItem,
  onTogglePerson,
}: {
  people: Person[];
  items: BillItem[];
  itemName: string;
  itemPrice: string;
  onItemNameChange: (value: string) => void;
  onItemPriceChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onTogglePerson: (itemId: string, personId: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <Input
            value={itemName}
            onChange={(event) => onItemNameChange(event.target.value)}
            placeholder="Item, e.g. Pizza"
            className="h-11 bg-background/70"
          />
          <Input
            value={itemPrice}
            onChange={(event) => onItemPriceChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAddItem();
            }}
            type="number"
            min="0"
            placeholder="Price"
            className="h-11 bg-background/70"
          />
          <Button onClick={onAddItem} className="h-11 px-5 font-semibold">
            Add Item
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add food, drinks, or anything from the receipt.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-background/45 p-4 shadow-lg shadow-black/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {formatPeso(item.price)}
                    </p>
                  </div>

                  <Button
                    onClick={() => onRemoveItem(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Shared by
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {people.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Add people to assign this item.
                      </p>
                    ) : (
                      people.map((person) => {
                        const selected = item.sharedBy.includes(person.id);

                        return (
                          <Button
                            key={person.id}
                            onClick={() => onTogglePerson(item.id, person.id)}
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className={
                              selected
                                ? "rounded-full font-semibold"
                                : "rounded-full bg-background/60"
                            }
                          >
                            {person.name}
                          </Button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
