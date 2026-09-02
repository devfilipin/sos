"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

type Props = { onToken: (token: string | null) => void };

export function TurnstileField({ onToken }: Props) {
  const [error, setError] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return <p className="formError" role="alert">CAPTCHA ainda não configurado.</p>;

  return <div className="captchaField">
    <div className="captchaWidget">
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token) => { setError(false); onToken(token); }}
        onExpire={() => onToken(null)}
        onError={(errorCode) => { setError(true); onToken(null); console.error("Turnstile error", errorCode); }}
        options={{ theme: "light", language: "pt-BR", size: "flexible" }}
      />
    </div>
    {error && <p className="captchaError" role="alert">A verificação de segurança não carregou. Recarregue a página. Se o problema continuar, avise o suporte.</p>}
  </div>;
}
