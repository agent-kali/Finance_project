import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Inlined for Vercel Edge (no @/ imports in middleware)
const DEMO_COOKIE = "demo_mode";
const AUTH_ROUTES = ["/login", "/register"] as const;
const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/ai-advisor",
  "/settings",
] as const;

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}
function getRootRedirectTarget(isDemo: boolean): "/dashboard" | "/login" {
  return isDemo ? "/dashboard" : "/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDemoMode = request.cookies.has(DEMO_COOKIE);
  const authRoute = isAuthRoute(pathname);
  const protectedRoute = isProtectedRoute(pathname);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = getRootRedirectTarget(isDemoMode);
    return NextResponse.redirect(url);
  }

  if (isDemoMode && protectedRoute) {
    return NextResponse.next();
  }

  if (isDemoMode && authRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && protectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && authRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
