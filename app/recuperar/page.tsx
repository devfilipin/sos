"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { createClient } from "@/lib/supabase/client";

export default function Recuperar() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaToken) return setMessage("Conclua a verificação de segurança.");
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(String(form.get("email")), {
      redirectTo: `${location.origin}/auth/callback?next=/redefinir`, captchaToken,
    });
    setBusy(false); setSent(true);
  }

  return <AuthShell eyebrow="RECUPERAÇÃO SEGURA" title="Redefinir sua senha">
    {sent ? <><p>Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.</p><Link className="primary linkButton" href="/entrar">Voltar para o login</Link></> : <form className="authForm" onSubmit={submit}>
      <label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required/>
      <TurnstileField onToken={setCaptchaToken}/>
      {message && <p className="formError" role="alert">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? "Enviando…" : "Enviar link de recuperação"}</button>
    </form>}
  </AuthShell>;
}
