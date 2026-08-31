import Image from "next/image";
import Link from "next/link";

export function AuthShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <main className="authPage">
    <Link className="authBrand" href="/" aria-label="Voltar para a página inicial">
      <Image src="/resolveulab-logo.jpeg" alt="ResolveuLab" width={64} height={57}/>
      <span>Resolveu<strong>Lab</strong></span>
    </Link>
    <section className="authCard">
      <p className="kicker">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </section>
  </main>;
}
