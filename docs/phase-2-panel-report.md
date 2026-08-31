# Fase 2 — painel e múltiplos perfis

Data da execução: 30 de agosto de 2026.

## Resultado

A fase 2 foi implementada localmente e aplicada ao projeto Supabase hospedado `sos`.

- Uma conta adulta pode administrar perfil próprio, de filho ou de dependente.
- Cada produto ativado fica associado explicitamente a um perfil.
- O painel persiste dados de emergência, visibilidade campo a campo, até três contatos e foto privada.
- Publicar exige produto ativo, conteúdo mínimo útil e dois consentimentos separados.
- Ocultar o perfil e bloquear produto perdido ou roubado têm efeito imediato na consulta pública.
- A projeção pública devolve somente campos autorizados e usa URL assinada curta para a foto.

## Banco e segurança

A migration `20260830222232_phase_2_multiple_managed_profiles.sql` foi aplicada com sucesso. O teste transacional de RLS cobriu usuárias A/B, pessoa anônima, múltiplos perfis, tentativa de criação e edição cruzada, Storage e acesso ao schema privado; a transação foi revertida no final.

O Security Advisor registrou três avisos esperados para as RPCs `server_publish_emergency_profile`, `server_hide_emergency_profile` e `server_block_my_product`. Elas são deliberadamente `SECURITY DEFINER`, restringem execução a `authenticated`, fixam `search_path` e validam `auth.uid()` contra a propriedade de cada recurso.

O Performance Advisor apontou apenas índices ainda não utilizados. Isso é esperado num banco sem dados de uso; os índices atendem chaves estrangeiras, ownership e janelas de rate limit e serão mantidos até existir telemetria suficiente.

## Funções publicadas

- `activate-product` versão 2, com JWT obrigatório.
- `get-emergency-profile` versão 2, pública por necessidade do produto, com projeção fechada, resposta uniforme, limite de tentativas e CAPTCHA progressivo.

## Validação local

Lint, testes de contrato, testes da aplicação e build de produção fazem parte do portão final. O Docker local não estava disponível durante esta execução; por isso o teste SQL foi executado de forma transacional no projeto vazio `sos`, sem preservar as fixtures.

## Próximos portões

Antes de disponibilizar para pessoas reais: configurar Turnstile e secrets definitivos, validar o fluxo ponta a ponta em navegador, configurar e testar recuperação de conta/e-mail, revisar textos legais, implementar exportação e exclusão de dados, configurar backup/monitoramento e publicar o frontend.
