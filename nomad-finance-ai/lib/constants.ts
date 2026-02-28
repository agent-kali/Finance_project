export const APP_NAME = "NomadFinance AI";
export const APP_DESCRIPTION =
  "AI-powered personal finance platform for digital nomads. Multi-currency tracking, expense categorization, and personalized financial insights.";

export const SUPPORTED_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "VND",
  "PLN",
  "THB",
  "IDR",
  "MYR",
  "SGD",
  "JPY",
  "TRY",
  "AED",
  "MXN",
  "BRL",
  "CHF",
  "AUD",
  "CAD",
  "HKD",
  "KRW",
  "INR",
  "PHP",
  "NZD",
  "ZAR",
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  VND: "₫",
  PLN: "zł",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  SGD: "S$",
  JPY: "¥",
  TRY: "₺",
  AED: "د.إ",
  MXN: "$",
  BRL: "R$",
  CHF: "Fr",
  AUD: "A$",
  CAD: "C$",
  HKD: "HK$",
  KRW: "₩",
  INR: "₹",
  PHP: "₱",
  NZD: "NZ$",
  ZAR: "R",
};

export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  VND: 27_350,
  PLN: 4.32,
  THB: 38.5,
  IDR: 17_200,
  MYR: 5.15,
  SGD: 1.45,
  JPY: 165,
  TRY: 34.5,
  AED: 3.95,
  MXN: 19.2,
  BRL: 5.8,
  CHF: 0.94,
  AUD: 1.65,
  CAD: 1.48,
  HKD: 8.45,
  KRW: 1_460,
  INR: 90,
  PHP: 60,
  NZD: 1.78,
  ZAR: 20.2,
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
  { label: "Settings", href: "/settings", icon: "Settings" as const },
] as const;
