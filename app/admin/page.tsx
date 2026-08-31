import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const claims = await requireUser("/admin");
  const appMetadata = claims.app_metadata as Record<string, unknown> | undefined;
  if (appMetadata?.role !== "admin") redirect("/painel?erro=acesso-negado");
  if (claims.aal !== "aal2") redirect("/seguranca?next=/admin");
  return <AdminClient/>;
}
