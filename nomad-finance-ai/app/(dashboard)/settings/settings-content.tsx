"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { useCurrency } from "@/lib/currency-context";
import type { SupportedCurrency } from "@/lib/constants";

export function SettingsContent() {
  const currencyContext = useCurrency();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and preferences
        </p>
      </div>

      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Choose how amounts and balances are shown across the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            {currencyContext ? (
              <CurrencySelector
                value={currencyContext.displayCurrency}
                onValueChange={(code) =>
                  currencyContext.setDisplayCurrency(code as SupportedCurrency)
                }
              />
            ) : (
              <CurrencySelector
                value="EUR"
                onValueChange={() => {}}
                className="opacity-50 pointer-events-none"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
