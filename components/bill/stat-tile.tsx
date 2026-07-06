export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/80 p-4 shadow-lg shadow-black/10">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
    </div>
  );
}
