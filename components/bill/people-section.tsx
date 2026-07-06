import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Person } from "@/lib/types";

export function PeopleSection({
  people,
  personName,
  onPersonNameChange,
  onAddPerson,
  onRemovePerson,
}: {
  people: Person[];
  personName: string;
  onPersonNameChange: (value: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (personId: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">People</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Input
            value={personName}
            onChange={(event) => onPersonNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAddPerson();
            }}
            placeholder="Name, e.g. Joseph"
            className="h-11 min-w-0 flex-1 bg-background/70"
          />
          <Button onClick={onAddPerson} className="h-11 px-5 font-semibold">
            Add
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add your barkada first.
            </p>
          ) : (
            people.map((person) => (
              <Button
                key={person.id}
                onClick={() => onRemovePerson(person.id)}
                variant="outline"
                size="sm"
                className="rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                title="Click to remove"
              >
                {person.name} x
              </Button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
