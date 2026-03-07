# Testing Strategy

## Overview

The project uses **Vitest** with **@testing-library/react** and **jsdom**. Tests run in CI before build (`npm run test:run`). No Playwright or E2E framework—unit and component tests provide a meaningful baseline.

## Test Categories

### 1. Unit Tests (pure logic)

| Target | File | Focus |
|--------|------|-------|
| Route/auth logic | `lib/auth-routes.test.ts` | AUTH_ROUTES, PROTECTED_ROUTES, isAuthRoute, isProtectedRoute, getRootRedirectTarget |
| Auth validation schemas | `lib/auth-schemas.test.ts` | loginSchema, registerSchema (Zod) |
| Currency conversion | `lib/currency.test.ts` | convertToBase, convertCurrency, formatCurrency, formatCompact |
| Currency conversion API | `lib/currency-conversion.test.ts` | Live API fallback logic |
| Date/time utilities | `lib/date-utils.test.ts` | getDateRange, getPeriodLabel, getSavingsSubtitle, getEmptyMessage |
| Demo constants | `lib/demo.test.ts` | DEMO_WALLETS, DEMO_TRANSACTIONS structure |
| Currencies metadata | `lib/currencies.test.ts` | Currency list and helpers |
| Class names utility | `lib/utils.test.ts` | cn() (clsx + twMerge) |

### 2. Server Action Tests

| Target | File | Focus |
|--------|------|-------|
| Transaction CRUD | `app/actions/transactions.test.ts` | createTransaction, updateTransaction, deleteTransaction—auth, validation, Supabase mocks |

### 3. Component Tests

| Target | File | Focus |
|--------|------|-------|
| DemoLoginButton | `components/auth/demo-login-button.test.tsx` | Click triggers enableDemoMode, sets location.href, loading state |
| LoginForm | `components/auth/login-form.test.tsx` | Renders fields, validation errors on empty submit |

## Helpers and Mocks

- **vitest.setup.ts**: `@testing-library/jest-dom`, `afterEach` cleanup
- **Mocks**: Supabase client and server (`vi.mock`), next/navigation (`useRouter`), `@/lib/demo-context` (`enableDemoMode`)
- **No shared test-utils**: Simple `render` from RTL; no custom wrapper (forms don’t need QueryClient)

## CI

- **Workflow**: `.github/workflows/ci.yml` runs `npm run test:run` before `npm run build`
- **passWithNoTests**: `false` in `vitest.config.ts`—CI fails if no tests run

## What Remains Untested

| Area | Reason |
|------|--------|
| **Proxy** | Edge runtime; logic covered by `lib/auth-routes.test.ts` |
| **Dashboard layout auth** | Server component with Supabase; covered indirectly by proxy + layout flow |
| **RegisterForm** | Schema covered by auth-schemas; full component test skipped for now |
| **useOptimisticMutation** | Thin react-query wrapper; actions that use it are tested |
| **Charts, dashboard widgets** | Recharts; would need heavier mocking; low ROI for unit tests |
| **AI advisor** | Depends on Groq API; better suited to integration/E2E if added |
| **Full login/register flow** | Requires Supabase auth; schema + component validation tests suffice for baseline |

## Adding Tests

1. **Pure functions** → `*.test.ts` next to or alongside the module
2. **Components** → `*.test.tsx` in the component directory
3. **Avoid snapshots** for UI; assert structure or behavior instead
4. **Mock external deps** (Supabase, router, etc.) at module boundaries
