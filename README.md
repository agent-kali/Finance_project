# Finance Project

Personal finance and portfolio projects — multi-currency tracking, dashboards, and AI-powered insights.

## Projects

### [NomadFinance AI](nomad-finance-ai/)

**Multi-currency finance platform for digital nomads.** Track expenses across currencies (EUR, USD, VND, GBP, PLN), visualize spending with Recharts, and get AI-powered financial advice (Groq + Vercel AI SDK).

- Next.js 16 (App Router, React 19), Supabase (Auth + RLS), TanStack Query v5
- Demo mode, optimistic mutations, glassmorphism UI
- Full setup and architecture: see [nomad-finance-ai/README.md](nomad-finance-ai/README.md)

### [Nomad Portfolio 2026](nomad-portfolio-2026/)

Portfolio and related projects — see the folder for details.

## Quick start (NomadFinance AI)

```bash
cd nomad-finance-ai
npm install
# Add .env.local (Supabase + optional Groq), run schema in Supabase
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Try Demo** on the login page to explore without signing up.
