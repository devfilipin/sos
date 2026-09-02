"use client";

import Link from "@/components/app-link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; publicCode: string; status: "available" | "active" | "blocked" | "revoked"; createdAt: string };
type Snapshot = { counts: Record<string, number>; products: Product[]; batches: { id: string; name: string; quantity: number; createdAt: string }[] };
type Credential = { publicCode: string; activationSecret: string; nfcToken: string };

/* eslint-disable react-hooks/set-state-in-effect -- initial remote snapshot is loaded after mount */
export default function Admin() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await createClient().functions.invoke("admin-manage-product", { body: { action: "list" } });
    setLoading(false);
    if (error) return setMessage("Não foi possível carregar a operação. Verifique a conexão e tente novamente.");
    setData(data as Snapshot);
    setMessage("");
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function batch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setGenerating(true);
    setMessage("");
    const { data, error } = await createClient().functions.invoke("admin-generate-batch", {
      body: { name: form.get("name"), quantity: Number(form.get("quantity")) },
    });
    setGenerating(false);
    if (error || !data?.credentials) return setMessage("Não foi possível gerar o lote. Verifique a sessão administrativa e tente novamente.");
    setCredentials(data.credentials as Credential[]);
    setMessage("Credenciais geradas. Salve agora: elas não serão exibidas novamente.");
    void load();
  }

  async function manage(product: Product, action: "block" | "unblock" | "revoke") {
    const reason = prompt("Informe o motivo desta ação administrativa:");
    if (!reason) return;
    const { error } = await createClient().functions.invoke("admin-manage-product", { body: { productId: product.id, action, reason } });
    if (error) return setMessage("A transição não foi permitida.");
    setMessage("Produto atualizado e ação auditada.");
    void load();
  }

  const counts = data?.counts ?? {};
  return <main className="dashboard">
    <aside><Link className="brand" href="/"><b>R</b>Resolveu<span>Lab</span></Link><nav><a className="active" href="/admin">▦ Operação</a></nav><small>Área administrativa<br/>MFA verificado • AAL2</small></aside>
    <section>
      <header><div><p className="kicker">ADMINISTRAÇÃO</p><h1>Operação Resolveu SOS</h1></div></header>
      <div className="metrics">{[["Disponíveis", counts.available || 0], ["Ativados", counts.active || 0], ["Bloqueados", counts.blocked || 0], ["Revogados", counts.revoked || 0]].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b></article>)}</div>
      <article className="table"><h2>Gerar lote</h2><form onSubmit={batch}>
        <input name="name" aria-label="Nome do lote" placeholder="Nome do lote" minLength={3} maxLength={80} required disabled={generating}/>
        <input name="quantity" aria-label="Quantidade" type="number" min={1} max={100} defaultValue={10} required disabled={generating}/>
        <button type="submit" className="primary" disabled={generating}>{generating ? "Gerando…" : "Gerar credenciais"}</button>
      </form>{credentials && <><p><b>Atenção:</b> esta é a única exibição dos segredos.</p><textarea readOnly aria-label="Credenciais geradas" rows={Math.min(12, credentials.length + 1)} value={["codigo,segredo_ativacao,token_nfc", ...credentials.map(item => [item.publicCode, item.activationSecret, item.nfcToken].join(","))].join("\n")}/><button type="button" onClick={() => setCredentials(null)}>Confirmar que salvei</button></>}</article>
      <article className="table" id="produtos"><h2>Produtos recentes</h2>{loading && <p role="status">Carregando operação…</p>}{data?.products.map(product => <p key={product.id}><b>{product.publicCode}</b><span>{product.status}</span><em>{new Intl.DateTimeFormat("pt-BR").format(new Date(product.createdAt))}</em><span>{product.status === "active" && <button type="button" onClick={() => manage(product, "block")}>Bloquear</button>}{product.status === "blocked" && <button type="button" onClick={() => manage(product, "unblock")}>Desbloquear</button>}{product.status !== "revoked" && <button type="button" onClick={() => manage(product, "revoke")}>Revogar</button>}</span></p>)}</article>
      {message && <div className="toast" role="status">{message}</div>}
    </section>
  </main>;
}
