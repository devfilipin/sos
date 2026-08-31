# Etapa 5 — página pública de emergência

Revalidada em 30 de agosto de 2026 após a implementação de múltiplos perfis.

## Entregue

- Consulta manual em `/sos?codigo=7KM4Q` e acesso NFC em `/e/{token}` sem login.
- O navegador consulta somente a Edge Function pública; não possui leitura direta das tabelas médicas.
- Token NFC transformado em SHA-256 antes da consulta e comparado somente com o hash armazenado.
- DTO construído no banco por lista positiva e condicionado ao mapa de visibilidade e ao estado publicado.
- Resposta genérica para produto inexistente, bloqueado, inativo, revogado, oculto ou inválido.
- Atraso mínimo uniforme, limite por origem anonimizada e CAPTCHA progressivo na busca manual.
- Cabeçalhos e metadados `no-store`/`noindex`; nenhuma ferramenta de analytics ou cookie adicional.
- Auditoria técnica mínima sem código, token ou conteúdo médico, com eliminação automática após 24 horas.
- Cada produto consulta explicitamente o perfil ao qual foi vinculado, sem presumir que ele representa a própria titular.
- Foto opcional permanece em bucket privado e é entregue somente por URL assinada com validade de 60 segundos.
- CORS contempla os cabeçalhos atuais do cliente Supabase, mantendo allowlist de origens.

## Validação

- Teste transacional remoto aprovado para consulta por código e NFC, allowlist de campos, contato privado, foto, produto bloqueado e perfil oculto.
- 35 contratos automatizados aprovados, além de lint e build de produção.
- `get-emergency-profile` publicada na versão 3 sem JWT, por ser a consulta pública do produto.
- `activate-product` publicada na versão 3 com JWT obrigatório, pois compartilha o envelope CORS.
- Fixtures revertidas; nenhum dado de teste permaneceu no projeto `sos`.

## Pendência operacional

`CAPTCHA_SECRET` precisa existir nos secrets das Edge Functions e corresponder ao widget Turnstile de produção. Essa configuração não pode ser comprovada pelo código-fonte e deve entrar no checklist de publicação.
