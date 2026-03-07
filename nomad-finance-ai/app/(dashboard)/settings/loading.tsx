import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32 sm:h-9 sm:w-40" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>

      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full max-w-sm" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full max-w-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-28" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full max-w-md" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full max-w-xs" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
