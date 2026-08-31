/* eslint-disable @next/next/no-img-element -- signed Storage URLs are intentionally rendered without Next's image proxy */
import Link from "next/link";

export type EmergencyContact = {
  name: string;
  relationship?: string;
  phone: string;
};

export type EmergencyProfileData = {
  preferredName?: string;
  photoUrl?: string;
  age?: number;
  pronouns?: string;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  supportNeeds?: string;
  medicalDevices?: string;
  transfusionPreference?: string;
  resuscitationPreference?: string;
  organDonorStatus?: string;
  organDonorNotes?: string;
  preferredLanguage?: string;
  healthPlanName?: string;
  otherGuidance?: string;
  contacts: EmergencyContact[];
  updatedAt: string;
};

export function EmergencyProfileView({
  profile,
  preview = false,
}: {
  profile: EmergencyProfileData;
  preview?: boolean;
}) {
  return <main className="emergency">
    <header>
      <Link className="brand" href="/"><b>R</b>Resolveu<span>Lab</span></Link>
      <span className="status">● {preview ? "PRÉVIA PRIVADA" : "PERFIL ATIVO"}</span>
    </header>
    {preview && <aside className="previewNotice"><b>Prévia antes da publicação</b><span>Somente você pode ver esta tela. Ela usa exatamente o mesmo layout e os mesmos campos da consulta pública.</span></aside>}
    <section className="identity">
      {profile.photoUrl ? <img className="publicPhoto" src={profile.photoUrl} alt="Foto de identificação do perfil" /> : <div className="avatar" aria-hidden="true">SOS</div>}
      <div><small>PERFIL DE EMERGÊNCIA</small><h1>{profile.preferredName || "Informações de emergência"}</h1><p>{[profile.age !== undefined && `${profile.age} anos`, profile.pronouns, profile.preferredLanguage].filter(Boolean).join(" • ")}</p></div>
    </section>
    {profile.allergies && <section className="alert"><small>⚠ INFORMAÇÃO PRIORITÁRIA</small><h2>ALERGIAS</h2><strong>{profile.allergies}</strong><p>Informado pela pessoa usuária ou responsável.</p></section>}
    <section className="medical">
      {profile.conditions && <article><small>CONDIÇÕES RELEVANTES</small><h3>{profile.conditions}</h3></article>}
      {profile.medications && <article><small>MEDICAMENTOS</small><h3>{profile.medications}</h3></article>}
      {profile.supportNeeds && <article><small>NECESSIDADES DE APOIO</small><h3>{profile.supportNeeds}</h3></article>}
      {profile.medicalDevices && <article><small>DISPOSITIVOS MÉDICOS</small><h3>{profile.medicalDevices}</h3></article>}
    </section>
    {profile.contacts.length > 0 && <section className="contacts"><small>CONTATOS DE EMERGÊNCIA</small><h2>Quem pode ajudar</h2>{profile.contacts.map((contact, index) => <a key={`${contact.phone}-${index}`} href={`tel:${contact.phone}`}><span><b>{contact.name}</b><small>{[contact.relationship, contact.phone].filter(Boolean).join(" • ")}</small></span><strong>☎ Ligar</strong></a>)}</section>}
    {(profile.bloodType || profile.healthPlanName || profile.otherGuidance || profile.transfusionPreference || profile.resuscitationPreference || profile.organDonorStatus) && <section className="statement">
      <h3>Outras declarações</h3>
      {profile.bloodType && <p><span>Tipo sanguíneo</span><b>{profile.bloodType} — informado pela pessoa responsável</b></p>}
      {profile.transfusionPreference && <p><span>Transfusão</span><b>{profile.transfusionPreference} — declaração pessoal</b></p>}
      {profile.resuscitationPreference && <p><span>Reanimação</span><b>{profile.resuscitationPreference} — não constitui diretiva médica</b></p>}
      {profile.organDonorStatus && profile.organDonorStatus !== "not_declared" && <p><span>Doação de órgãos</span><b>{profile.organDonorStatus === "yes" ? "Declara ser doador(a)" : profile.organDonorStatus === "no" ? "Declara não ser doador(a)" : "Não sabe"}{profile.organDonorNotes ? ` — ${profile.organDonorNotes}` : ""}</b></p>}
      {profile.healthPlanName && <p><span>Plano de saúde</span><b>{profile.healthPlanName}</b></p>}
      {profile.otherGuidance && <p><span>Orientações</span><b>{profile.otherGuidance}</b></p>}
    </section>}
    <footer><p>Atualizado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(profile.updatedAt))}</p><small>Informações declaradas pela pessoa usuária ou responsável. Este perfil auxilia em situações de emergência, mas não substitui avaliação profissional, documento médico ou prontuário.</small></footer>
  </main>;
}
