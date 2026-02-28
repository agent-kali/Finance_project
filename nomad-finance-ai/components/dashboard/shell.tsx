"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode, disableDemoMode } from "@/lib/demo-context";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { useCurrency } from "@/lib/currency-context";
import type { SupportedCurrency } from "@/lib/constants";
import {
  Brain,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { type ReactNode, useState } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";

const ICONS = {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Brain,
  Settings,
} as const;

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

type ShellUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  const router = useRouter();
  const { isDemo } = useDemoMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useMounted();
  const currencyContext = useCurrency();

  const initials = ((user.user_metadata?.full_name as string) || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    if (isDemo) {
      disableDemoMode();
      router.push("/login");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-svh bg-gradient-nomad">
      <div className="bg-ambient-glow" aria-hidden="true" />
      <div className="bg-particles" aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside className="glass-sidebar hidden w-64 shrink-0 md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex-1 px-3 py-4">
            <NavLinks />
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Top bar */}
        <header className="glass-header flex h-14 items-center gap-4 px-4 md:px-6">
          {mounted ? (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-semibold tracking-tight">{APP_NAME}</span>
                </div>
                <div className="px-3 py-4">
                  <NavLinks onClick={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          <div className="flex-1" />

          {mounted && currencyContext && (
            <CurrencySelector
              value={currencyContext.displayCurrency}
              onValueChange={(code) => currencyContext.setDisplayCurrency(code as SupportedCurrency)}
            />
          )}

          <ThemeToggle />

          <Separator orientation="vertical" className="h-6 opacity-30" />

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">
                      {(user.user_metadata?.full_name as string) || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </header>

        {/* Page content */}
        <main className="relative z-10 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
