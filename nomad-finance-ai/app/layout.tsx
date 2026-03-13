import type { Metadata } from "next";
import { Providers } from "./providers";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "digital nomad",
    "finance",
    "multi-currency",
    "expense tracking",
    "AI financial advisor",
  ],
  authors: [{ name: "Daniel Alexandrov" }],
  openGraph: {
    type: "website",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          style={{ position: "absolute", left: "-9999px", top: "auto" }}
          className="z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:fixed focus:left-4 focus:top-4 focus:z-9999"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
