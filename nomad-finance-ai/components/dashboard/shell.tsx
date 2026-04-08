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
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/command-palette";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { CommandPaletteProvider } from "@/lib/command-palette-context";
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

const SETTINGS_ITEM = NAV_ITEMS.find((item) => item.icon === "Settings");
const MAIN_NAV_ITEMS = NAV_ITEMS.filter((item) => item.icon !== "Settings");

function DesktopNavIcons() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-1" aria-label="Main navigation">
      {MAIN_NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
  const pathname = usePathname();
  const { isDemo } = useDemoMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useMounted();

  const initials = ((user.user_metadata?.full_name as string) || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    if (isDemo) {
      disableDemoMode();
      router.push("/");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const settingsActive = SETTINGS_ITEM && pathname === SETTINGS_ITEM.href;

  return (
    <CommandPaletteProvider>
      <div className="relative flex h-svh overflow-x-hidden bg-gradient-nomad">
        <div className="bg-ambient-glow" aria-hidden="true" />
        <div className="bg-particles" aria-hidden="true" />

        {/* Desktop sidebar — icon-only */}
        <aside className="glass-sidebar hidden w-16 shrink-0 lg:block">
          <div className="flex h-full flex-col items-center py-4">
            {/* Serif "N" logo */}
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center text-xl font-semibold text-foreground"
              aria-label="Dashboard home"
            >
              N
            </Link>

            <div className="mt-6 flex-1">
              <DesktopNavIcons />
            </div>

            {/* Settings pinned to bottom */}
            {SETTINGS_ITEM && (
              <Link
                href={SETTINGS_ITEM.href}
                aria-label={SETTINGS_ITEM.label}
                aria-current={settingsActive ? "page" : undefined}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  settingsActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {settingsActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <Settings className="h-[18px] w-[18px]" />
              </Link>
            )}
          </div>
        </aside>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          {/* Top bar — minimal */}
          <header className="glass-header flex min-h-14 min-w-0 items-center gap-2 overflow-x-hidden px-4 md:px-6">
            {mounted ? (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon-touch" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
                    <span className="text-xl font-semibold text-foreground">N</span>
                    <span className="font-semibold tracking-tight">{APP_NAME}</span>
                  </div>
                  <div className="px-3 py-4">
                    <MobileNavLinks onClick={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="icon-touch" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            )}

            <div className="flex-1" />

            {mounted && (
              <div className="flex min-w-0 items-center gap-1">
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">View in</span>
                <CurrencySelector className="min-w-0 max-w-[96px] sm:max-w-none" />
              </div>
            )}

            <ThemeToggle />

            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-touch" className="relative rounded-full" aria-label="User menu">
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
              <Button variant="ghost" size="icon-touch" className="relative rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )}
          </header>

          {/* Page content */}
          <main id="main-content" className="relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>

      <CommandPalette />
    </CommandPaletteProvider>
  );
}
