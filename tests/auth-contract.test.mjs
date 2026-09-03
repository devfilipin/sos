import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Auth usa chave publicável e cookies SSR", async () => {
  const [browser, server, proxy] = await Promise.all([read("../lib/supabase/client.ts"), read("../lib/supabase/server.ts"), read("../proxy.ts")]);
  for (const source of [browser, server]) assert.match(source, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(`${browser}${server}${proxy}`, /SERVICE_ROLE|SUPABASE_SECRET_KEY/);
  assert.match(server, /cookies/);
  assert.match(proxy, /getClaims\(\)/);
});

test("cadastro, login e recuperação enviam CAPTCHA", async () => {
  const [signup, signin, recovery] = await Promise.all([read("../app/cadastro/page.tsx"), read("../app/entrar/page.tsx"), read("../app/recuperar/page.tsx")]);
  assert.match(signup, /signUp[\s\S]*captchaToken/);
  assert.match(signin, /signInWithPassword[\s\S]*captchaToken/);
  assert.match(recovery, /resetPasswordForEmail[\s\S]*captchaToken/);
});

test("senha exige 12 caracteres e recuperação não enumera e-mail", async () => {
  const [signup, recovery] = await Promise.all([read("../app/cadastro/page.tsx"), read("../app/recuperar/page.tsx")]);
  assert.match(signup, /password\.length < 12/);
  assert.match(recovery, /Se o e-mail estiver cadastrado/);
  assert.doesNotMatch(recovery, /error\.message/);
});

test("rotas privadas validam claims e admin exige app_metadata mais AAL2", async () => {
  const [auth, admin] = await Promise.all([read("../lib/auth.ts"), read("../app/admin/page.tsx")]);
  assert.match(auth, /auth\.getClaims\(\)/);
  assert.match(admin, /app_metadata/);
  assert.match(admin, /claims\.aal !== "aal2"/);
  assert.match(admin, /\/seguranca\?next=\/admin/);
  assert.doesNotMatch(admin, /user_metadata/);
});

test("MFA usa TOTP, é opcional para contas comuns e obrigatório no admin", async () => {
  const [security, signin] = await Promise.all([read("../app/seguranca/seguranca-client.tsx"), read("../app/entrar/page.tsx")]);
  assert.match(security, /factorType: "totp"/);
  assert.match(security, /listFactors/);
  assert.match(security, /challengeAndVerify/);
  assert.match(signin, /location\.assign\(next\)/);
  assert.doesNotMatch(signin, /getAuthenticatorAssuranceLevel/);
  assert.match(security, /Agora não — continuar sem ativar/);
});

test("callback restringe redirecionamento e troca código por sessão", async () => {
  const [callback, safe] = await Promise.all([read("../app/auth/callback/route.ts"), read("../lib/return-to.ts")]);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(safe, /value\.startsWith\("\/\/"\)/);
  assert.match(safe, /url\.origin === "https:\/\/resolveu\.local"/);
});
