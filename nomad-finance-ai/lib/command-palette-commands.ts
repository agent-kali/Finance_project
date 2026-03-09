import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Brain,
  Settings,
  Plus,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "./constants";

export type CommandAction =
  | { type: "navigate"; href: string }
  | { type: "theme"; value: "light" | "dark" | "system" }
  | {
      type: "quick-action";
      action: "add-transaction" | "add-wallet" | "ask-ai";
    };

const NAV_ICONS: Record<(typeof NAV_ITEMS)[number]["icon"], LucideIcon> = {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Brain,
  Settings,
};

export type CommandDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
  action: CommandAction;
};

export type CommandGroup = {
  heading: string;
  commands: CommandDef[];
};

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    heading: "Navigation",
    commands: NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      icon: NAV_ICONS[item.icon],
      keywords: [item.label.toLowerCase(), item.href],
      action: { type: "navigate", href: item.href } as const,
    })),
  },
  {
    heading: "Quick Actions",
    commands: [
      {
        id: "quick-add-transaction",
        label: "Add Transaction",
        icon: Plus,
        keywords: ["add", "new", "transaction", "expense", "income"],
        action: { type: "quick-action", action: "add-transaction" },
      },
      {
        id: "quick-add-wallet",
        label: "Add Wallet",
        icon: Plus,
        keywords: ["add", "new", "wallet", "currency"],
        action: { type: "quick-action", action: "add-wallet" },
      },
      {
        id: "quick-ask-ai",
        label: "Ask AI Advisor",
        icon: Brain,
        keywords: ["ai", "advisor", "chat", "ask"],
        action: { type: "quick-action", action: "ask-ai" },
      },
    ],
  },
  {
    heading: "Theme",
    commands: [
      {
        id: "theme-light",
        label: "Light",
        icon: Sun,
        keywords: ["light", "day"],
        action: { type: "theme", value: "light" },
      },
      {
        id: "theme-dark",
        label: "Dark",
        icon: Moon,
        keywords: ["dark", "night"],
        action: { type: "theme", value: "dark" },
      },
      {
        id: "theme-system",
        label: "System",
        icon: Monitor,
        keywords: ["system", "auto", "prefer"],
        action: { type: "theme", value: "system" },
      },
    ],
  },
];
