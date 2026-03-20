"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddTransactionSheet } from "./add-transaction-sheet";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

export function MobileFab() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 transition-transform active:scale-95 sm:hidden"
      >
        <Plus className="h-5 w-5" />
      </button>

      {open ? <AddTransactionSheet open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
