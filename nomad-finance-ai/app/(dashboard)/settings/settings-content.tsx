"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { DefaultWalletSelector } from "@/components/ui/default-wallet-selector";

export function SettingsContent() {
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
            <CurrencySelector />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle>Default Wallet</CardTitle>
          <CardDescription>
            New transactions will use this wallet by default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Default Wallet</Label>
            <DefaultWalletSelector />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
