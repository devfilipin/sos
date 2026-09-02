"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { useEffect, useRef, useState } from "react";

const steps = [
  ["01", "Aproxime o celular", "Encoste o aparelho no chaveiro Resolveu SOS."],
  ["02", "Veja o que importa", "Acesse apenas as informações autorizadas."],
  ["03", "Entre em contato", "Ligue para um contato com um toque."],
];

function Brand() {
  return <a className="brand" href="#inicio"><Image src="/resolveulab-logo.jpeg" alt="ResolveuLab" width={52} height={46}/><span>Resolveu<strong>Lab</strong></span></a>;
}

export default function Home() {
  const [code, setCode] = useState("");
  const [showLookup, setShowLookup] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalize = (value: string) => value.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, "").slice(0, 5);
  const submitCode = () => { if (code.length === 5) location.href = `/sos?codigo=${code}`; };

  useEffect(() => { if (showLookup) inputRef.current?.focus(); }, [showLookup]);

  return <main>
    {showLookup && <div className="modal-backdrop" role="presentation">
      <section className="emergency-modal" role="dialog" aria-modal="true" aria-labelledby="emergency-title">
        <button className="modal-close" type="button" onClick={() => setShowLookup(false)} aria-label="Fechar consulta">×</button>
        <Image className="modal-logo" src="/resolveulab-logo.jpeg" alt="ResolveuLab" width={190} height={169} priority />
        <p className="kicker">ACESSO RÁPIDO ÀS INFORMAÇÕES</p>
        <h2 id="emergency-title">Tem um código de emergência?</h2>
        <p>Digite os 5 caracteres impressos no verso do chaveiro.</p>
        <form onSubmit={(event) => { event.preventDefault(); submitCode(); }}>
          <label htmlFor="codigo-modal">Código público</label>
          <div><input ref={inputRef} id="codigo-modal" value={code} onChange={(event) => setCode(normalize(event.target.value))} placeholder="7KM4Q" autoComplete="off"/><button aria-label="Consultar código" disabled={code.length !== 5}>→</button></div>
          <small>O código não contém 0, O, 1, I ou L.</small>
        </form>
        <button className="continue-site" type="button" onClick={() => setShowLookup(false)}>Continuar para o site</button>
      </section>
    </div>}
    <nav className="nav"><Brand/><div><a href="#como">Como funciona</a><a href="#seguranca">Segurança</a><Link className="navLogin" href="/entrar">Entrar</Link></div></nav>
    <section className="hero" id="inicio"><div><p className="kicker">● INFORMAÇÃO QUE PODE FAZER A DIFERENÇA</p><h1>Seu cuidado sempre <em>por perto.</em></h1><p className="lead">Um chaveiro inteligente que conecta quem precisa de ajuda às informações essenciais — de forma rápida, segura e sob seu controle.</p><div className="actions"><Link className="primary" href="/ativar">Ativar meu Resolveu SOS →</Link><a href="#consulta">Consultar código</a></div><small>✓ Sem aplicativo · ✓ Você controla os dados · ✓ Acesso em segundos</small></div><div className="visual"><i/><div className="ring"/><div className="tag"><b>R</b><span>RESOLVEU</span><strong>SOS</strong><small>)))</small></div><span className="nfc-status">● NFC ATIVO</span></div></section>
    <section className="lookup" id="consulta"><div><p className="kicker">PLANO B SEMPRE À MÃO</p><h2>Tem um código de emergência?</h2><p>Digite os 5 caracteres impressos no verso do chaveiro.</p></div><form onSubmit={(event) => { event.preventDefault(); submitCode(); }}><label htmlFor="codigo">Código público</label><div><input id="codigo" value={code} onChange={(event) => setCode(normalize(event.target.value))} placeholder="7KM4Q"/><button aria-label="Consultar código" disabled={code.length !== 5}>→</button></div><small>O código não contém 0, O, 1, I ou L.</small></form></section>
    <section className="how" id="como"><header><p className="kicker">SIMPLES QUANDO MAIS IMPORTA</p><h2>Como funciona</h2></header><div className="steps">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><i>{number === "01" ? "⌁" : number === "02" ? "✦" : "☎"}</i><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="security" id="seguranca"><div className="shield">◇</div><div><p className="kicker">PRIVACIDADE DESDE O INÍCIO</p><h2>Você decide o que fica público.</h2><p>Todos os campos começam privados. Você escolhe, visualiza e autoriza cada informação antes de publicar — e pode ocultar tudo imediatamente.</p></div><ul><li><b>Controle individual</b><small>Privado ou público, campo por campo</small></li><li><b>Sem rastreamento</b><small>Nenhum anúncio ou pixel na emergência</small></li><li><b>Feito para emergências</b><small>Rápido, acessível e sem exigir login</small></li></ul></section>
    <footer><Brand/><p>Transformamos problemas do dia a dia em soluções impressas em 3D.</p><nav><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a><a href="/consentimento">Consentimento</a><a href="mailto:contato@resolveuapp.com.br">Contato</a></nav><small>© 2026 ResolveuLab. Informações declaradas pela pessoa usuária não substituem avaliação profissional.</small></footer>
  </main>;
}
