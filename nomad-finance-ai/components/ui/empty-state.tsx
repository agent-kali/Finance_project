"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  subtext?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaHref?: string;
  iconSize?: "default" | "large";
  iconClassName?: string;
  suggestionChips?: string[];
  onChipClick?: (text: string) => void;
  className?: string;
  chipDisabled?: boolean;
}

export function EmptyState({
  icon: Icon,
  heading,
  subtext,
  ctaLabel,
  onCtaClick,
  ctaHref,
  iconSize = "default",
  iconClassName = "text-muted-foreground/70",
  suggestionChips,
  onChipClick,
  className,
  chipDisabled = false,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 px-4 min-h-[200px] w-full",
        className
      )}
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, scale: 0.98 }
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 0.35, ease: "easeOut" }
      }
    >
      <Icon
        className={cn(
          iconSize === "large" ? "h-16 w-16" : "h-12 w-12",
          iconClassName
        )}
        aria-hidden
      />
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold leading-tight">{heading}</h3>
        {subtext ? (
          <p className="text-sm text-muted-foreground max-w-sm line-clamp-2">
            {subtext}
          </p>
        ) : null}
      </div>
      {ctaLabel && (onCtaClick || ctaHref) && (
        ctaHref ? (
          <Button asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button onClick={onCtaClick}>{ctaLabel}</Button>
        )
      )}
      {suggestionChips && suggestionChips.length > 0 && onChipClick && (
        <div className="flex flex-wrap justify-center gap-2">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChipClick(chip)}
              disabled={chipDisabled}
              className={cn(
                "rounded-xl border border-border/60 bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition-colors",
                "hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
                "disabled:pointer-events-none disabled:opacity-50",
                "dark:border-border/40 dark:bg-muted/30 dark:hover:border-primary/40 dark:hover:bg-primary/10"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );

  return content;
}
