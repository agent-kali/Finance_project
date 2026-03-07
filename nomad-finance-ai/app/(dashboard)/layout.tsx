import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { DemoProvider } from "@/lib/demo-context";
import { TimeRangeProvider } from "@/lib/time-range-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { CurrencyConversionProvider } from "@/lib/currency-conversion-context";
import { DefaultWalletProvider } from "@/lib/default-wallet-context";
import { prefetchDashboardData } from "@/lib/query-prefetch";
import { DEMO_COOKIE, DEMO_USER } from "@/lib/demo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.has(DEMO_COOKIE);

  if (isDemoMode) {
    return (
      <DemoProvider initialValue>
        <CurrencyProvider>
          <CurrencyConversionProvider>
            <DefaultWalletProvider>
              <TimeRangeProvider>
                <DashboardShell user={DEMO_USER}>{children}</DashboardShell>
              </TimeRangeProvider>
            </DefaultWalletProvider>
          </CurrencyConversionProvider>
        </CurrencyProvider>
      </DemoProvider>
    );
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const dehydratedState = await prefetchDashboardData(supabase);

  return (
    <DemoProvider>
      <CurrencyProvider>
        <CurrencyConversionProvider>
          <HydrationBoundary state={dehydratedState}>
            <DefaultWalletProvider>
              <TimeRangeProvider>
                <DashboardShell user={user}>{children}</DashboardShell>
              </TimeRangeProvider>
            </DefaultWalletProvider>
          </HydrationBoundary>
        </CurrencyConversionProvider>
      </CurrencyProvider>
    </DemoProvider>
  );
}
