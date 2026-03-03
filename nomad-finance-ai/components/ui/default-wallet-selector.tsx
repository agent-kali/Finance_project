"use client";

import * as React from "react";
import { ChevronDown, Check, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getCurrency } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import {
  useDefaultWallet,
  useEffectiveDefaultWalletId,
} from "@/lib/default-wallet-context";
import { useWallets } from "@/lib/hooks/use-wallets";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import type { Wallet } from "@/types/database.types";

export interface DefaultWalletSelectorProps {
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
  variant?: "default" | "compact";
  showTooltip?: boolean;
}

function getWalletLabel(wallet: Wallet): string {
  return `${wallet.currency} Wallet`;
}

function getWalletSearchValue(wallet: Wallet): string {
  const entry = getCurrency(wallet.currency);
  const parts = [
    wallet.currency,
    "Wallet",
    getWalletLabel(wallet),
    entry?.symbol ?? "",
    entry?.name ?? "",
  ];
  return parts.join(" ");
}

export function DefaultWalletSelector({
  value: valueProp,
  onValueChange: onValueChangeProp,
  className,
  variant = "default",
  showTooltip = true,
}: DefaultWalletSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [successKey, setSuccessKey] = React.useState(0);
  const walletContext = useDefaultWallet();
  const effectiveId = useEffectiveDefaultWalletId();
  const { data: wallets, isLoading } = useWallets();
  const currencyContext = useCurrency();
  const displayCurrency = currencyContext?.displayCurrency ?? "EUR";

  const isControlled =
    valueProp !== undefined && onValueChangeProp !== undefined;
  const value = isControlled ? valueProp : effectiveId ?? null;
  const onValueChange = isControlled
    ? (onValueChangeProp as (id: string) => void)
    : (id: string) => {
        walletContext?.setDefaultWallet(id);
        setSuccessKey((k) => k + 1);
      };

  const selectedWallet = value
    ? wallets?.find((w) => w.id === value)
    : undefined;
  const hasWallets = wallets && wallets.length > 0;

  const handleSelect = (id: string) => {
    onValueChange(id);
    setOpen(false);
  };

  const handleStarClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    handleSelect(id);
  };

  if (isLoading || !hasWallets) {
    return (
      <div
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground dark:border-border dark:bg-muted/20 sm:px-4 sm:text-sm",
          className
        )}
        title={showTooltip ? "New transactions will go here by default" : undefined}
      >
        <Star className="h-4 w-4 shrink-0" />
        <span>{hasWallets === false ? "No wallets" : "Loading..."}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Select default wallet"
          aria-expanded={open}
          title={
            showTooltip
              ? "New transactions will go here by default. Converted at Frankfurter rate."
              : undefined
          }
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium transition-all duration-150 hover:bg-muted/60 hover:text-foreground dark:border-border dark:bg-muted/20 dark:hover:bg-muted/40 sm:px-4 sm:text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "text-foreground",
            successKey > 0 && "animate-in animation-duration-[300ms]",
            className
          )}
        >
          {selectedWallet ? (
            <>
              <Star
                className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500 dark:fill-amber-500 dark:text-amber-400"
                aria-hidden
              />
              <span className="font-semibold">
                {variant === "compact"
                  ? selectedWallet.currency
                  : getWalletLabel(selectedWallet)}
              </span>
              {variant !== "compact" && (
                <span className="hidden text-muted-foreground sm:inline">
                  {formatCurrency(
                    convertCurrency(
                      selectedWallet.balance,
                      selectedWallet.currency as SupportedCurrency,
                      displayCurrency as SupportedCurrency
                    ),
                    displayCurrency as SupportedCurrency
                  )}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Select default</span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-50 transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search wallets..."
            className="h-10"
          />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No wallet found.</CommandEmpty>
            <CommandGroup heading="Your wallets">
              {wallets?.map((wallet) => {
                const isSelected = value === wallet.id;
                const currencyEntry = getCurrency(wallet.currency);
                const balanceInDisplay = convertCurrency(
                  wallet.balance,
                  wallet.currency as SupportedCurrency,
                  displayCurrency as SupportedCurrency
                );

                return (
                  <CommandItem
                    key={wallet.id}
                    value={getWalletSearchValue(wallet)}
                    onSelect={() => handleSelect(wallet.id)}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-base"
                      aria-hidden
                    >
                      {currencyEntry?.flag ?? wallet.currency}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold">
                        {getWalletLabel(wallet)}
                      </span>
                      <span className="ml-2 text-muted-foreground truncate">
                        {formatCurrency(
                          balanceInDisplay,
                          displayCurrency as SupportedCurrency
                        )}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleStarClick(e, wallet.id)}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-transform hover:bg-muted",
                        isSelected
                          ? "text-amber-500 [&>svg]:fill-amber-400 dark:[&>svg]:fill-amber-500"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label={isSelected ? "Default wallet" : "Make default"}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isSelected && "fill-current scale-110"
                        )}
                      />
                    </button>
                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
