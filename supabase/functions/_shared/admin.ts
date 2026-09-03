import { createClient } from "npm:@supabase/supabase-js@2.112.3";

type AccessClaims = { aal?: string; sub?: string; session_id?: string };

function decodeClaims(token: string): AccessClaims | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as AccessClaims;
  } catch {
    return null;
  }
}

export async function requireAdmin(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || !token) return null;

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await client.auth.getUser(token);
  const claims = decodeClaims(token);
  if (error || !user || claims?.sub !== user.id || !claims.session_id) return null;
  if (user.app_metadata?.role !== "admin" || claims.aal !== "aal2") return null;
  return { client, user, claims };
}
