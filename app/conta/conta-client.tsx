"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContaClient() {
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportData() {
    setBusy(true);
    const { data, error } = await createClient().functions.invoke("export-my-data", { body: {} });
    setBusy(false);
    if (error) return setMessage("Não foi possível gerar a exportação.");
    const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `resolveu-sos-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setMessage("Exportação gerada no seu dispositivo.");
  }

  async function remove() {
    if (confirmation !== "EXCLUIR MINHA CONTA") return;
    setBusy(true);
    const { error } = await createClient().functions.invoke("delete-my-account", { body: { confirmation } });
    if (error) { setBusy(false); return setMessage("Por segurança, entre novamente e volte a esta página para confirmar a exclusão."); }
    location.assign("/");
  }

  return <main className="authPage"><section className="authCard">
    <p className="kicker">DADOS E PRIVACIDADE</p><h1>Minha conta</h1>
    <p>Baixe uma cópia dos perfis, contatos, produtos e consentimentos sob sua gestão.</p>
    <button type="button" className="primary" disabled={busy} onClick={exportData}>{busy ? "Gerando…" : "Exportar meus dados"}</button>
    <hr/><h2>Excluir conta</h2><p>A exclusão oculta os perfis, revoga os produtos e remove os dados e fotos da conta. Esta ação não pode ser desfeita.</p>
    <label>Digite EXCLUIR MINHA CONTA<input value={confirmation} onChange={event => setConfirmation(event.target.value)}/></label>
    <button type="button" className="danger" disabled={busy || confirmation !== "EXCLUIR MINHA CONTA"} onClick={remove}>Excluir permanentemente</button>
    {message && <p role="status">{message}</p>}<p><Link href="/painel">← Voltar ao painel</Link></p>
  </section></main>;
}
