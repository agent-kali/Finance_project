import { APP_NAME } from "@/lib/constants";
import { Brain } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Multi-currency finance tracking for digital nomads
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
