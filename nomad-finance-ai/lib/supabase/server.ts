import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  fetch("http://127.0.0.1:7289/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"09b5b5"},body:JSON.stringify({sessionId:"09b5b5",runId:"pre-fix",hypothesisId:"H5",location:"lib/supabase/server.ts:createClient",message:"Supabase server client initialized",data:{hasUrl:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),hasAnonKey:Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)},timestamp:Date.now()})}).catch(()=>{});

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can read cookies but may not be allowed to write them.
            // In this app, auth refresh is handled safely in proxy.ts.
          }
        },
      },
    }
  );
}
