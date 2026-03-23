import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-9 w-64 rounded-full" />

      {/* Hero balance skeleton — centered */}
      <div className="space-y-12">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-16 w-72 sm:h-20 sm:w-96" />
          <Skeleton className="mt-3 h-4 w-56" />
        </div>
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-3 divide-x divide-border/30">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-0 px-3 text-center sm:px-6">
                <Skeleton className="mx-auto h-3 w-16" />
                <Skeleton className="mx-auto mt-2 h-6 w-12 sm:h-8 sm:w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI insight skeleton */}
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <Skeleton className="mx-auto h-4 w-4 rounded-full" />
        <Skeleton className="mx-auto h-4 w-80" />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
      </div>

      {/* Recent activity skeleton */}
      <Card className="glass-card min-h-[280px]">
        <CardHeader>
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-0 divide-y divide-border/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
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
