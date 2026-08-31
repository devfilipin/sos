import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AtivarClient from "./ativar-client";

export default async function AtivarPage() {
  await requireUser("/ativar");
  const supabase=await createClient();
  const{data:profiles}=await supabase.from("emergency_profiles").select("id,preferred_name,subject_relationship").order("updated_at",{ascending:false});
  return <AtivarClient profiles={profiles??[]}/>;
}
