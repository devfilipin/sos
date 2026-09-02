"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { safeReturnTo } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/client";

type Enrollment = { id: string; qrCode: string; secret: string };

export default function SegurancaClient() {
  const next = safeReturnTo(useSearchParams().get("next"), "/painel");
  const [level, setLevel] = useState("aal1");
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]).then(([assurance, factors]) => {
      setLevel(assurance.data?.currentLevel ?? "aal1");
      setVerifiedFactorId(factors.data?.totp.find((factor) => factor.status === "verified")?.id ?? null);
    });
  }, []);

  async function startEnrollment() {
    setMessage("");
    const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Resolveu SOS" });
    if (error) return setMessage("Não foi possível iniciar a configuração do autenticador.");
    setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const factorId = enrollment?.id ?? verifiedFactorId;
    if (!factorId || !/^\d{6}$/.test(code)) return setMessage("Digite o código de 6 dígitos do autenticador.");
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return setMessage("Código inválido ou expirado. Tente novamente.");
    setLevel("aal2"); setEnrollment(null); setMessage("Identidade confirmada com sucesso.");
    if (verifiedFactorId) location.assign(next);
  }

  return <main className="authPage"><section className="authCard securityCard">
    <p className="kicker">SEGURANÇA DA CONTA</p><h1>Autenticação em duas etapas</h1>
    <p>Status atual: <strong>{level === "aal2" ? "MFA verificado" : "senha verificada"}</strong>.</p>
    {!verifiedFactorId && !enrollment && level !== "aal2" && <button className="primary securityAction" onClick={startEnrollment}>Configurar aplicativo autenticador</button>}
    {verifiedFactorId && level !== "aal2" && <form className="authForm" onSubmit={verify}>
      <p>Digite o código atual do seu aplicativo autenticador para continuar.</p>
      <label htmlFor="mfa-login-code">Código de 6 dígitos</label><input id="mfa-login-code" value={code} onChange={(event)=>setCode(event.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code"/>
      <button className="primary">Confirmar identidade</button>
    </form>}
    {enrollment && <form className="authForm" onSubmit={verify}>
      <p>Leia o QR Code com um aplicativo autenticador. Se necessário, use a chave manual abaixo.</p>
      <Image className="mfaQr" src={enrollment.qrCode} alt="QR Code para configurar o autenticador" width={220} height={220} unoptimized/>
      <code className="mfaSecret">{enrollment.secret}</code>
      <label htmlFor="mfa-code">Código de 6 dígitos</label><input id="mfa-code" value={code} onChange={(event)=>setCode(event.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code"/>
      <button className="primary">Confirmar e ativar</button>
    </form>}
    {message && <p className={message.includes("sucesso") ? "formSuccess" : "formError"} role="status">{message}</p>}
    <div className="authLinks"><Link href="/painel">← Voltar ao painel</Link><form action="/auth/sair" method="post"><button className="textButton">Sair</button></form></div>
  </section></main>;
}
