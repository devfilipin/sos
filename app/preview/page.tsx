import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyProfileData, EmergencyProfileView } from "@/components/emergency-profile-view";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prévia privada | Resolveu SOS", robots: { index: false, follow: false } };

type ProfileRow = {
  id: string;
  preferred_name: string | null;
  photo_path: string | null;
  birth_date: string | null;
  pronouns: string | null;
  blood_type: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  support_needs: string | null;
  medical_devices: string | null;
  transfusion_preference: string | null;
  resuscitation_preference: string | null;
  organ_donor_status: string;
  organ_donor_notes: string | null;
  preferred_language: string | null;
  health_plan_name: string | null;
  other_guidance: string | null;
  visibility: Record<string, boolean>;
  updated_at: string;
};

function ageFromBirthDate(value: string | null) {
  if (!value) return undefined;
  const birth = new Date(`${value}T00:00:00Z`);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
  return age >= 0 ? age : undefined;
}

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const { perfil } = await searchParams;
  await requireUser(`/preview${perfil ? `?perfil=${encodeURIComponent(perfil)}` : ""}`);
  const supabase = await createClient();
  const { data } = perfil ? await supabase.from("emergency_profiles").select("*").eq("id", perfil).maybeSingle() : { data: null };
  const profile = data as ProfileRow | null;

  if (!profile) return <main className="emergencyState"><Link className="brand" href="/"><b>R</b>Resolveu<span>Lab</span></Link><h1>Perfil não encontrado</h1><p>Escolha um perfil no painel para abrir a prévia privada.</p><Link className="primary" href="/painel">Voltar ao painel</Link></main>;

  const visibility = profile.visibility ?? {};
  const [{ data: contacts }, photo] = await Promise.all([
    visibility.contacts
      ? supabase.from("emergency_contacts").select("name,relationship,phone").eq("emergency_profile_id", profile.id).eq("is_public", true).order("sort_order")
      : Promise.resolve({ data: [] }),
    visibility.photo && profile.photo_path
      ? supabase.storage.from("profile-photos").createSignedUrl(profile.photo_path, 900)
      : Promise.resolve({ data: null }),
  ]);
  const visible = <K extends keyof ProfileRow>(key: string, column: K) => visibility[key] ? profile[column] : undefined;
  const publicProfile: EmergencyProfileData = {
    preferredName: visible("preferred_name", "preferred_name") as string | undefined,
    photoUrl: photo.data?.signedUrl,
    age: visibility.age ? ageFromBirthDate(profile.birth_date) : undefined,
    pronouns: visible("pronouns", "pronouns") as string | undefined,
    bloodType: visible("blood_type", "blood_type") as string | undefined,
    allergies: visible("allergies", "allergies") as string | undefined,
    conditions: visible("conditions", "conditions") as string | undefined,
    medications: visible("medications", "medications") as string | undefined,
    supportNeeds: visible("support_needs", "support_needs") as string | undefined,
    medicalDevices: visible("medical_devices", "medical_devices") as string | undefined,
    transfusionPreference: visible("transfusion_preference", "transfusion_preference") as string | undefined,
    resuscitationPreference: visible("resuscitation_preference", "resuscitation_preference") as string | undefined,
    organDonorStatus: visible("organ_donor_status", "organ_donor_status") as string | undefined,
    organDonorNotes: visible("organ_donor_status", "organ_donor_notes") as string | undefined,
    preferredLanguage: visible("preferred_language", "preferred_language") as string | undefined,
    healthPlanName: visible("health_plan_name", "health_plan_name") as string | undefined,
    otherGuidance: visible("other_guidance", "other_guidance") as string | undefined,
    contacts: (contacts ?? []).map(contact => ({ name: contact.name, relationship: contact.relationship ?? undefined, phone: contact.phone })),
    updatedAt: profile.updated_at,
  };

  return <EmergencyProfileView profile={publicProfile} preview />;
}
