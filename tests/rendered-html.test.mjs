import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza a home da Resolveu SOS com consulta prioritária", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<title>Resolveu SOS \| Seu cuidado sempre por perto<\/title>/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Tem um código de emergência\?/);
  assert.match(html, /resolveulab-logo\.jpeg/);
  assert.doesNotMatch(html, /codex-preview|Building your site|Starter Project/);
});

test("mantém metadados e identidade da aplicação", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /Resolveu SOS/);
  assert.match(layout, /lang="pt-BR"/);
  assert.match(page, /resolveulab-logo\.jpeg/);
  assert.match(page, /ACESSO RÁPIDO ÀS INFORMAÇÕES/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
