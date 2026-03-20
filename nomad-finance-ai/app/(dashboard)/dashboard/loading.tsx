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
      <div className="space-y-12">
        <div>
          <Skeleton className="h-14 w-72 sm:h-16 sm:w-96" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/35 px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-3 divide-x divide-border/30">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                <Skeleton className="h-3 w-16 sm:w-20" />
                <Skeleton className="mt-2 h-6 w-14 sm:h-8 sm:w-28" />
                {i === 2 ? <Skeleton className="mt-2 h-1 w-full rounded-full" /> : null}
              </div>
            ))}
          </div>
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
