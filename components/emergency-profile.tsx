"use client";

import Link from "@/components/app-link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { EmergencyProfileData, EmergencyProfileView } from "@/components/emergency-profile-view";
import { createClient } from "@/lib/supabase/client";

const normalize = (value: string) => value.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, "").slice(0, 5);

export function EmergencyProfile({ mode }: {mode:"code"|"nfc"}) {
  const search = useSearchParams();
  const [code, setCode] = useState(() => normalize(search.get("codigo") || ""));
  const [profile, setProfile] = useState<EmergencyProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const lookup = useCallback(async (tokenOverride?: string | null) => {
    const identifier = mode === "code" ? code : decodeURIComponent(location.pathname.split("/").pop() || "");
    if (mode === "code" && identifier.length !== 5) return;
    setLoading(true);
    setSearched(false);
    const { data, error } = await createClient().functions.invoke("get-emergency-profile", {
      body: mode === "code"
        ? { mode, code: identifier, captchaToken: tokenOverride ?? captchaToken }
        : { mode, token: identifier },
    });
    setLoading(false);
    setSearched(true);
    if (error || !data) {
      setProfile(null);
      return;
    }
    setCaptchaRequired(Boolean(data.captchaRequired));
    setProfile(data.profile || null);
  }, [captchaToken, code, mode]);

  useEffect(() => {
    const identifier = mode === "code" ? code : decodeURIComponent(location.pathname.split("/").pop() || "");
    if ((mode === "code" && identifier.length === 5) || (mode === "nfc" && identifier.length >= 22)) queueMicrotask(() => void lookup(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(event: FormEvent) {
    event.preventDefault();
    void lookup();
  }

  if (loading) return <main className="emergencyState" aria-busy="true"><div className="emergencySpinner" /><h1>Consultando perfil…</h1><p>Isso pode levar alguns segundos em uma conexão móvel.</p></main>;
  if (profile) return <EmergencyProfileView profile={profile} />;

  return <main className="emergencyState">
    <Link className="brand" href="/"><b>R</b>Resolveu<span>Lab</span></Link>
    <p className="kicker">CONSULTA DE EMERGÊNCIA</p>
    <h1>{searched ? "Perfil não disponível" : "Consultar código"}</h1>
    <p>{searched ? "Não foi possível acessar um perfil ativo com essas informações." : "Digite os 5 caracteres impressos no chaveiro."}</p>
    {mode === "code" && <form className="emergencyLookup" onSubmit={submit}>
      <label htmlFor="emergency-code">Código público</label>
      <input id="emergency-code" value={code} onChange={event => { setCode(normalize(event.target.value)); setSearched(false); }} maxLength={5} autoComplete="off" placeholder="7KM4Q" />
      {captchaRequired && <><p>Confirme que você é uma pessoa para continuar.</p><TurnstileField onToken={setCaptchaToken} /></>}
      <button className="primary" disabled={code.length !== 5 || (captchaRequired && !captchaToken)}>Consultar perfil</button>
    </form>}
    <small>A mesma mensagem é exibida quando o produto está inativo, bloqueado, oculto ou não existe.</small>
  </main>;
}
