import Link from "@/components/app-link";

export function LegalPage({ title, version, children }: { title: string; version: string; children: React.ReactNode }) {
  return <main className="legalPage"><article><Link href="/">← Resolveu SOS</Link><p className="kicker">MINUTA PARA REVISÃO JURÍDICA • {version}</p><h1>{title}</h1><aside>Este documento é uma minuta operacional do MVP e precisa de revisão jurídica antes da publicação comercial.</aside>{children}<hr/><p>Dúvidas, suporte e privacidade: <a href="mailto:resolveulab@gmail.com">resolveulab@gmail.com</a>.</p></article></main>;
}
