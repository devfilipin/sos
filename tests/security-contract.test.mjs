import test from"node:test";import assert from"node:assert/strict";import{readFile}from"node:fs/promises";
const sql=await readFile(new URL("../supabase/migrations/20260821183828_initial_schema.sql",import.meta.url),"utf8");
const hardening=(await Promise.all([
  readFile(new URL("../supabase/migrations/20260821184103_harden_public_write_surface.sql",import.meta.url),"utf8"),
  readFile(new URL("../supabase/migrations/20260821184242_harden_profile_creation.sql",import.meta.url),"utf8"),
])).join("\n");
test("RLS nas tabelas públicas",()=>{for(const t of["profiles","emergency_profiles","emergency_contacts","consent_events","user_products"])assert.match(sql,new RegExp(`alter table public\\.${t} enable row level security`))});
test("update preserva ownership",()=>assert.match(sql,/for update to authenticated using\(\(select auth\.uid\(\)\)=user_id\) with check\(\(select auth\.uid\(\)\)=user_id\)/));
test("anon sem grant médico",()=>assert.doesNotMatch(sql,/grant .*public\.(profiles|emergency_profiles|emergency_contacts).* to anon/));
test("código público é único e restrito",()=>assert.match(sql,/public_code text not null unique check\(public_code/));
test("hash NFC exige SHA-256",()=>assert.match(sql,/octet_length\(nfc_token_hash\)=32/));
test("visibilidade é objeto JSON",()=>assert.match(sql,/jsonb_typeof\(visibility\)='object'/));
test("projeção de produtos tem ownership",()=>assert.match(sql,/user_products_select.*auth\.uid\(\)\)=user_id/));
test("chaves estrangeiras privadas usadas em busca têm índice",()=>{assert.match(sql,/product_batches_created_by_idx/);assert.match(sql,/products_batch_id_idx/)});
test("índice ineficaz de produto ativo não existe",()=>assert.doesNotMatch(sql,/one_active_product_owner/));
test("publicação direta não tem grant de coluna",()=>{assert.match(hardening,/revoke update on public\.emergency_profiles/);assert.doesNotMatch(hardening,/grant update\([^)]*status/)});
test("consentimento é inserido somente pelo servidor",()=>{assert.match(hardening,/drop policy if exists consent_insert/);assert.match(hardening,/revoke insert on public\.consent_events/)});
test("Storage permite excluir somente na própria pasta",()=>assert.match(hardening,/create policy photo_delete[\s\S]*storage\.foldername\(name\)/));
test("perfil não nasce publicado pelo cliente",()=>assert.doesNotMatch(hardening,/grant insert\([^)]*(status|published_at)/));
