import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-64 rounded-full" />
        </div>
      </div>

      {/* Hero balance skeleton */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-14 w-72 sm:h-16 sm:w-96" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-0 sm:divide-x sm:divide-border/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sm:px-6 first:sm:pl-0 last:sm:pr-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-28" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity skeleton */}
      <Card className="glass-card min-h-[280px]">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/50 space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="min-h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="min-h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="min-h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
