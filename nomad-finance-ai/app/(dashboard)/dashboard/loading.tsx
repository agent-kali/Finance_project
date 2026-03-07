import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton
                className="h-10 w-36 sm:h-12"
                style={{ letterSpacing: "-1.5px" }}
              />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/50 space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1 max-w-[200px]" />
                <Skeleton className="h-5 w-16 shrink-0" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Skeleton className="h-[200px] w-[200px] shrink-0 rounded-full" />
            <div className="w-full space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
