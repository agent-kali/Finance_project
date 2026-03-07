import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TransactionsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-40" />
        </div>

        <Card className="glass-card glass-card-hover">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-12" />
                    </th>
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-14" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
