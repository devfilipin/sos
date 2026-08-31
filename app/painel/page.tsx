import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PainelClient from "./painel-client";
import "./painel.css";

export default async function PainelPage() {
  const claims=await requireUser("/painel");
  const supabase=await createClient();
  const[{data:profiles},{data:products},{data:contacts},{data:consents}]=await Promise.all([
    supabase.from("emergency_profiles").select("*").order("updated_at",{ascending:false}),
    supabase.from("user_products").select("*").order("activated_at",{ascending:false}),
    supabase.from("emergency_contacts").select("*").order("sort_order"),
    supabase.from("consent_events").select("id,emergency_profile_id,event_type,document_version,created_at,revoked_at").order("created_at",{ascending:false}),
  ]);
  const photoUrls:Record<string,string>={};
  for(const profile of profiles??[]){if(profile.photo_path){const{data}=await supabase.storage.from("profile-photos").createSignedUrl(profile.photo_path,900);if(data?.signedUrl)photoUrls[profile.id]=data.signedUrl}}
  return <PainelClient userId={String(claims.sub)} initialProfiles={profiles??[]} initialProducts={products??[]} initialContacts={contacts??[]} initialConsents={consents??[]} initialPhotoUrls={photoUrls}/>;
}
