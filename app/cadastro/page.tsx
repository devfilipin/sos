"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { createClient } from "@/lib/supabase/client";

export default function Cadastro() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const strength = password.length >= 16 ? "forte" : password.length >= 12 ? "adequada" : "insuficiente";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (password.length < 12) return setMessage("Use uma senha com pelo menos 12 caracteres.");
    if (password !== String(form.get("confirmPassword"))) return setMessage("As senhas não coincidem.");
    if (!captchaToken) return setMessage("Conclua a verificação de segurança.");
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password,
      options: {
        data: { display_name: String(form.get("name")).trim(), terms_version: "terms-v1", privacy_version: "privacy-v1", adult_confirmed: true },
        captchaToken,
        emailRedirectTo: `${location.origin}/auth/callback?next=/painel`,
      },
    });
    setBusy(false);
    if (error) return setMessage("Não foi possível concluir o cadastro. Tente novamente em instantes.");
    setSuccess(true);
  }

  if (success) return <AuthShell eyebrow="CONFIRMAÇÃO NECESSÁRIA" title="Confira seu e-mail"><p>Enviamos uma mensagem de confirmação. Abra o link para ativar sua conta e continuar.</p><Link className="primary linkButton" href="/entrar">Voltar para o login</Link></AuthShell>;

  return <AuthShell eyebrow="SUA CONTA RESOLVEU SOS" title="Criar uma conta">
    <form className="authForm" onSubmit={submit}>
      <label htmlFor="name">Nome</label><input id="name" name="name" autoComplete="name" maxLength={80} required/>
      <label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required/>
      <label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event)=>setPassword(event.target.value)}/>
      <small className={`passwordStrength ${strength}`}>Força da senha: {strength}. Mínimo de 12 caracteres.</small>
      <label htmlFor="confirmPassword">Confirmar senha</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required/>
      <label className="authCheck"><input type="checkbox" required/> Confirmo que tenho 18 anos ou mais e aceito os <Link href="/termos">Termos de Uso</Link> e a <Link href="/privacidade">Política de Privacidade</Link>.</label>
      <TurnstileField onToken={setCaptchaToken}/>
      {message && <p className="formError" role="alert">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? "Criando conta…" : "Criar conta"}</button>
    </form>
    <div className="authLinks"><span>Já tem uma conta?</span><Link href="/entrar">Entrar</Link></div>
  </AuthShell>;
}
