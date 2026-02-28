export const APP_NAME = "NomadFinance AI";
export const APP_DESCRIPTION =
  "AI-powered personal finance platform for digital nomads. Multi-currency tracking, expense categorization, and personalized financial insights.";

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "VND", "GBP", "PLN"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: "€",
  USD: "$",
  VND: "₫",
  GBP: "£",
  PLN: "zł",
};

export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  EUR: 1,
  USD: 1.08,
  VND: 27_350,
  GBP: 0.85,
  PLN: 4.32,
};

export const EXPENSE_CATEGORIES = [
  "Housing",
  "Food & Dining",
  "Transportation",
  "Coworking",
  "Health & Insurance",
  "Entertainment",
  "Shopping",
  "SaaS & Tools",
  "Travel",
  "Education",
  "Utilities",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Transfer",
  "Other",
] as const;

export const DEMO_CREDENTIALS = {
  email: "demo@nomadfinance.app",
  password: "demo123456",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" as const },
  { label: "Transactions", href: "/transactions", icon: "ArrowLeftRight" as const },
  { label: "Wallets", href: "/wallets", icon: "Wallet" as const },
  { label: "AI Advisor", href: "/ai-advisor", icon: "Brain" as const },
] as const;
