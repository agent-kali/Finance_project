import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function WalletsLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading wallets">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="glass-card rounded-xl px-5 py-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton
            className="mt-2 h-12 w-40 sm:h-14"
            style={{ letterSpacing: "-1.5px" }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="glass-card glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton
                className="h-10 w-32 sm:h-12"
                style={{ letterSpacing: "-1.5px" }}
              />
              <Skeleton className="mt-1 h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
