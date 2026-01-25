export function DataTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
