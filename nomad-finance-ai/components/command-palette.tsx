"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCommandPalette } from "@/lib/command-palette-context";
import { COMMAND_GROUPS } from "@/lib/command-palette-commands";

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { open, closePalette } = useCommandPalette();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  function runAction(
    action:
      | { type: "navigate"; href: string }
      | { type: "theme"; value: "light" | "dark" | "system" }
      | {
          type: "quick-action";
          action: "add-transaction" | "add-wallet" | "ask-ai";
        }
  ) {
    switch (action.type) {
      case "navigate":
        router.push(action.href);
        closePalette();
        break;
      case "theme":
        setTheme(action.value);
        closePalette();
        break;
      case "quick-action":
        if (action.action === "add-transaction") {
          router.push("/transactions?action=create");
        } else if (action.action === "add-wallet") {
          router.push("/wallets?action=create");
        } else {
          router.push("/ai-advisor");
        }
        closePalette();
        break;
    }
  }

  if (!mounted) return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closePalette();
      }}
      title="Command Palette"
      description="Search for a command to run"
      className="sm:max-w-[480px]"
    >
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        {COMMAND_GROUPS.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.commands.map((cmd) => {
              const Icon = cmd.icon;
              const filterValue = [cmd.label, ...(cmd.keywords ?? [])].join(" ");
              return (
                <CommandItem
                  key={cmd.id}
                  value={filterValue}
                  onSelect={() => runAction(cmd.action)}
                >
                  <Icon className="h-4 w-4" />
                  {cmd.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
      <div className="border-t px-3 py-2">
        <p className="text-muted-foreground text-xs">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑</kbd>
          <kbd className="ml-0.5 rounded bg-muted px-1.5 py-0.5 font-mono">↓</kbd>
          {" navigate · "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
          {" select · "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Esc</kbd>
          {" close"}
        </p>
      </div>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger() {
  const { openPalette } = useCommandPalette();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openPalette}
      className="flex gap-1.5 text-muted-foreground"
      aria-label="Open command palette"
    >
      <CommandIcon className="h-4 w-4" />
      <span className="hidden lg:inline">Search</span>
      <kbd className="pointer-events-none hidden rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
        ⌘K
      </kbd>
    </Button>
  );
}
