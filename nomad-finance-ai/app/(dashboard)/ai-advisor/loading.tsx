import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AiAdvisorLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading AI advisor">
      <Skeleton className="h-9 w-52" />

      <Card className="glass-card flex h-[calc(100svh-10rem)] flex-col overflow-hidden rounded-xl border">
        <CardHeader className="shrink-0 border-b">
          <Skeleton className="h-5 w-40" />
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-8 overflow-y-auto p-4 min-h-[300px]">
          <div className="flex w-full max-w-lg flex-col items-center gap-8">
            <div className="flex w-full items-center justify-center gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>

        <div className="shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
}
