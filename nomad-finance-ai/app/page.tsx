import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/demo";
import { getRootRedirectTarget } from "@/lib/auth-routes";

export default async function Home() {
  const cookieStore = await cookies();
  const target = getRootRedirectTarget(cookieStore.has(DEMO_COOKIE));
  redirect(target);
}
