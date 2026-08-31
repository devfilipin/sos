import { requireUser } from "@/lib/auth";
import SegurancaClient from "./seguranca-client";

export default async function SegurancaPage() {
  await requireUser("/seguranca");
  return <SegurancaClient/>;
}
