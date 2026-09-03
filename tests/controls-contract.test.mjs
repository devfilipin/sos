import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("estilos de botões são carregados por último e preservam ações largas", async () => {
  const [layout, controls] = await Promise.all([read("../app/layout.tsx"), read("../app/controls.css")]);
  assert.match(layout, /legal\.css";import "\.\/controls\.css"/);
  assert.match(controls, /\.table form[\s\S]*grid-template-columns: minmax\(220px, 1fr\) 120px max-content/);
  assert.match(controls, /\.createProfile > \.primary[\s\S]*min-width: 190px/);
  assert.match(controls, /\.logoutButton[\s\S]*width: 100%/);
  assert.match(controls, /\.lookup form button,[\s\S]*width: 56px/);
  assert.match(controls, /button\.toggle[\s\S]*min-height: 24px/);
});

test("navegação interna não depende do next/link incompatível com o Worker", async () => {
  const files = [
    "../app/page.tsx", "../app/entrar/page.tsx", "../app/cadastro/page.tsx",
    "../app/painel/painel-client.tsx", "../app/admin/admin-client.tsx",
    "../app/conta/conta-client.tsx", "../app/produtos/produtos-client.tsx",
    "../components/legal-page.tsx",
  ];
  const sources = await Promise.all(files.map(read));
  assert.doesNotMatch(sources.join("\n"), /from\s*["']next\/link["']/);
});

test("CORS inclui os domínios publicados sem abrir origem curinga", async () => {
  const http = await read("../supabase/functions/_shared/http.ts");
  assert.match(http, /https:\/\/sos\.resolveulab\.com\.br/);
  assert.match(http, /https:\/\/sos\.resolveuapp\.com\.br/);
  assert.doesNotMatch(http, /access-control-allow-origin[^\n]*\*/i);
});
