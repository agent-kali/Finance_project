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

      <section aria-label="Display settings">
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
      </section>

      <section aria-label="Default wallet">
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
      </section>

      <section aria-label="Keyboard shortcuts">
        <Card className="glass-card glass-card-hover">
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>
              Navigate and use the app with the keyboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
                <dt className="font-medium text-foreground">Command palette</dt>
                <dd className="text-muted-foreground font-mono text-xs">Cmd/Ctrl + K</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
                <dt className="font-medium text-foreground">Close modal or dialog</dt>
                <dd className="text-muted-foreground font-mono text-xs">Escape</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
                <dt className="font-medium text-foreground">Move between elements</dt>
                <dd className="text-muted-foreground font-mono text-xs">Tab</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-muted/50 px-3 py-2">
                <dt className="font-medium text-foreground">Activate button or link</dt>
                <dd className="text-muted-foreground font-mono text-xs">Enter or Space</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-md bg-muted/50 px-3 py-2 sm:col-span-2">
                <dt className="font-medium text-foreground">Navigate dropdowns and menus</dt>
                <dd className="text-muted-foreground font-mono text-xs">Arrow keys</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
