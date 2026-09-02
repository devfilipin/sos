"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = { product_id: string; public_code: string; status: string; activated_at: string };

export default function ProdutosClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function unblock(id: string) {
    setBusyId(id);
    const { data, error } = await createClient().rpc("server_unblock_my_product", { p_product_id: id });
    setBusyId(null);
    if (error || !data) return setMessage("Para desbloquear, entre novamente e repita a ação. Em caso de suspeita, contate o suporte.");
    setProducts(items => items.map(product => product.product_id === id ? { ...product, status: "active" } : product));
    setMessage("Produto desbloqueado.");
  }

  return <main className="authPage"><section className="authCard">
    <p className="kicker">MEUS PRODUTOS</p><h1>Segurança dos chaveiros</h1>
    {products.map(product => <article key={product.product_id}><h2>{product.public_code}</h2><p>Status: {product.status}</p>{product.status === "blocked" && <button type="button" className="primary" disabled={busyId === product.product_id} onClick={() => unblock(product.product_id)}>{busyId === product.product_id ? "Desbloqueando…" : "Desbloquear com sessão recente"}</button>}</article>)}
    {!products.length && <p>Nenhum produto ativado.</p>}{message && <p role="status">{message}</p>}
    <Link href="/painel">← Voltar ao painel</Link>
  </section></main>;
}
