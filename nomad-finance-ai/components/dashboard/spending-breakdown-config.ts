"use client";

import {
  Car,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Home,
  Lightbulb,
  Monitor,
  Package,
  Plane,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type SpendingBreakdownIconName =
  | "UtensilsCrossed"
  | "Car"
  | "Monitor"
  | "Settings"
  | "Home"
  | "Plane"
  | "ShoppingBag"
  | "HeartPulse"
  | "Lightbulb"
  | "Clapperboard"
  | "GraduationCap"
  | "Package";

export interface SpendingCategoryVisual {
  readonly label: string;
  readonly color: string;
  readonly bg: string;
  readonly icon: SpendingBreakdownIconName;
}

export const SPENDING_BREAKDOWN_ICONS: Record<
  SpendingBreakdownIconName,
  LucideIcon
> = {
  UtensilsCrossed,
  Car,
  Monitor,
  Settings,
  Home,
  Plane,
  ShoppingBag,
  HeartPulse,
  Lightbulb,
  Clapperboard,
  GraduationCap,
  Package,
};

export const SPENDING_BREAKDOWN_FALLBACK: SpendingCategoryVisual = {
  label: "Other",
  color: "#808080",
  bg: "rgba(128,128,128,0.18)",
  icon: "Package",
};

export const SPENDING_BREAKDOWN_CATEGORY_CONFIG: Record<
  string,
  SpendingCategoryVisual
> = {
  "Food & Dining": {
    label: "Food",
    color: "#D4A054",
    bg: "rgba(212,160,84,0.18)",
    icon: "UtensilsCrossed",
  },
  Transportation: {
    label: "Transport",
    color: "#7B8CDE",
    bg: "rgba(123,140,222,0.18)",
    icon: "Car",
  },
  Coworking: {
    label: "Cowork",
    color: "#4ECDC4",
    bg: "rgba(78,205,196,0.18)",
    icon: "Monitor",
  },
  "SaaS & Tools": {
    label: "Tools",
    color: "#A89F91",
    bg: "rgba(168,159,145,0.18)",
    icon: "Settings",
  },
  Housing: {
    label: "Housing",
    color: "#B8956A",
    bg: "rgba(184,149,106,0.18)",
    icon: "Home",
  },
  Travel: {
    label: "Travel",
    color: "#C27C6B",
    bg: "rgba(194,124,107,0.18)",
    icon: "Plane",
  },
  Shopping: {
    label: "Shopping",
    color: "#CC8844",
    bg: "rgba(204,136,68,0.18)",
    icon: "ShoppingBag",
  },
  "Health & Insurance": {
    label: "Health",
    color: "#7A9B6D",
    bg: "rgba(122,155,109,0.18)",
    icon: "HeartPulse",
  },
  Utilities: {
    label: "Utilities",
    color: "#8A9BAE",
    bg: "rgba(138,155,174,0.18)",
    icon: "Lightbulb",
  },
  Entertainment: {
    label: "Fun",
    color: "#A78BA5",
    bg: "rgba(167,139,165,0.18)",
    icon: "Clapperboard",
  },
  Education: {
    label: "Learning",
    color: "#8A9BAE",
    bg: "rgba(138,155,174,0.18)",
    icon: "GraduationCap",
  },
  Other: SPENDING_BREAKDOWN_FALLBACK,
};

export function getSpendingCategoryVisual(
  category: string,
): SpendingCategoryVisual {
  return (
    SPENDING_BREAKDOWN_CATEGORY_CONFIG[category] ?? {
      ...SPENDING_BREAKDOWN_FALLBACK,
      label: category,
    }
  );
}
