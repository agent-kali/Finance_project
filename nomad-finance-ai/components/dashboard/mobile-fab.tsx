"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";

export function MobileFab() {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-black shadow-lg shadow-cyan-500/40"
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <AddTransactionSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

