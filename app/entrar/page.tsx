"use client";

import Link from "@/components/app-link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { safeReturnTo } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/client";

export default function Entrar() {
  const next = safeReturnTo(useSearchParams().get("next"));
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaToken) return setMessage("Conclua a verificação de segurança.");
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: { captchaToken },
    });
    if (error) { setMessage("Não foi possível entrar. Confira os dados e tente novamente."); setBusy(false); return; }
    location.assign(next);
  }

  return <AuthShell eyebrow="ACESSO SEGURO" title="Entrar na sua conta">
    <form className="authForm" onSubmit={submit}>
      <label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required/>
      <label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required/>
      <TurnstileField onToken={setCaptchaToken}/>
      {message && <p className="formError" role="alert">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
    </form>
    <div className="authLinks"><Link href="/recuperar">Esqueci minha senha</Link><Link href="/cadastro">Criar uma conta</Link></div>
  </AuthShell>;
}
