import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { count } = await supabase
    .from("wallets")
    .select("id", { count: "exact", head: true });

  if (count !== null && count >= 1) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      {children}
    </div>
  );
}
