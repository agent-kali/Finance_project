"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

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
import {
  getCurrency,
  getPopularCurrencies,
  getOtherCurrencies,
} from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import { useCurrencyConversion } from "@/lib/currency-conversion-context";
import type { SupportedCurrency } from "@/lib/constants";

function formatRatesDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Rates updated today";
  return `Rates from ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export interface CurrencySelectorProps {
  value?: string;
  onValueChange?: (code: string) => void;
  className?: string;
}

export function CurrencySelector({
  value: valueProp,
  onValueChange: onValueChangeProp,
  className,
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const currencyContext = useCurrency();
  const { ratesDate, error } = useCurrencyConversion() ?? { ratesDate: null, error: null };

  const isControlled =
    valueProp !== undefined && onValueChangeProp !== undefined;
  const value = isControlled
    ? valueProp
    : (currencyContext?.displayCurrency ?? "EUR");
  const onValueChange = isControlled
    ? (onValueChangeProp as (code: string) => void)
    : (code: string) => currencyContext?.setDisplayCurrency(code as SupportedCurrency);

  const selected = getCurrency(value);

  const handleSelect = (code: string) => {
    onValueChange?.(code);
    setOpen(false);
  };

  const popularCurrencies = getPopularCurrencies();
  const otherCurrencies = getOtherCurrencies();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Select currency"
          aria-expanded={open}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium transition-all duration-150 hover:bg-muted/60 hover:text-foreground dark:border-border dark:bg-muted/20 dark:hover:bg-muted/40 sm:px-4 sm:text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "text-foreground",
            className
          )}
        >
          {selected ? (
            <>
              <span className="text-base leading-none" aria-hidden>
                {selected.flag}
              </span>
              <span className="hidden sm:inline">{selected.symbol}</span>
              <span className="font-semibold">{selected.code}</span>
              <span className="hidden truncate max-w-28 text-muted-foreground lg:inline">
                {selected.shortName}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {value ? `${value} (unknown)` : "Select currency"}
            </span>
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
        <div className="flex flex-col">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search currencies..."
            className="h-10"
          />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup heading="Popular for Nomads">
              {popularCurrencies.map((currency) => {
                const isSelected = value === currency.code;
                return (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name} ${currency.shortName}`}
                    onSelect={() => handleSelect(currency.code)}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-base"
                      aria-hidden
                    >
                      {currency.flag}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold">
                        {currency.symbol} {currency.code}
                      </span>
                      <span className="ml-2 text-muted-foreground truncate">
                        {currency.name}
                      </span>
                    </span>
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
            <CommandGroup heading="All currencies">
              {otherCurrencies.map((currency) => {
                const isSelected = value === currency.code;
                return (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name} ${currency.shortName}`}
                    onSelect={() => handleSelect(currency.code)}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-base"
                      aria-hidden
                    >
                      {currency.flag}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold">
                        {currency.symbol} {currency.code}
                      </span>
                      <span className="ml-2 text-muted-foreground truncate">
                        {currency.name}
                      </span>
                    </span>
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
        {(ratesDate || error) && (
          <p className="border-t border-border px-3 py-2 text-center text-xs text-muted-foreground shrink-0">
            {error ? "Using approximate rates" : formatRatesDate(ratesDate!)}
          </p>
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
