import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeReturnTo } from "@/lib/return-to";

export async function getClaims() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return error ? null : data?.claims ?? null;
}

export async function requireUser(returnTo: string) {
  const claims = await getClaims();
  if (!claims?.sub) redirect(`/entrar?next=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return claims;
}
