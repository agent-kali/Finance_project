import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AiAdvisorLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-52" />
      <Card className="glass-card flex h-[600px] flex-col">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    </div>
  );
}
