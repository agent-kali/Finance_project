import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { DemoProvider } from "@/lib/demo-context";
import { TimeRangeProvider } from "@/lib/time-range-context";
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
        <TimeRangeProvider>
          <DashboardShell user={DEMO_USER}>{children}</DashboardShell>
        </TimeRangeProvider>
      </DemoProvider>
    );
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <DemoProvider>
      <TimeRangeProvider>
        <DashboardShell user={user}>{children}</DashboardShell>
      </TimeRangeProvider>
    </DemoProvider>
  );
}
