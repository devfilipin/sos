"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function Redefinir() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 12) return setMessage("Use uma senha com pelo menos 12 caracteres.");
    if (password !== String(form.get("confirmPassword"))) return setMessage("As senhas não coincidem.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage("O link expirou ou não foi possível atualizar a senha. Solicite um novo link.");
    location.assign("/painel?senha=atualizada");
  }

  return <AuthShell eyebrow="NOVA SENHA" title="Escolha uma nova senha">
    <form className="authForm" onSubmit={submit}>
      <label htmlFor="password">Nova senha</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required/>
      <label htmlFor="confirmPassword">Confirmar nova senha</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required/>
      {message && <p className="formError" role="alert">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? "Salvando…" : "Salvar nova senha"}</button>
    </form>
  </AuthShell>;
}
