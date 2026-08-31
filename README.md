# Resolveu SOS — MVP local

Aplicação mobile-first para validar a proposta do chaveiro NFC de emergência da ResolveuLab.

## Rodar localmente

Requer Node.js 22. Na pasta do projeto, execute `npm install` e `npm run dev`, depois abra `http://localhost:3000`.

Rotas disponíveis: `/` (home e consulta), `/ativar`, `/painel`, `/sos?codigo=7KM4Q` e `/admin`. O painel já persiste perfis, contatos, consentimentos e vínculos de produtos no Supabase. Para validação local, use somente dados fictícios.

## Conectar ao Supabase “sos”

1. Copie `.env.example` para `.env.local` e preencha URL e chave publicável.
2. Vincule a pasta ao projeto Supabase correto com a CLI.
3. Valide as migrations localmente e aplique-as no único projeto hospedado `sos`.
4. Configure confirmação de e-mail, CAPTCHA, URLs autorizadas e SMTP.
5. Configure secrets das Edge Functions; nunca coloque a chave secreta no frontend.
6. Configure o bucket privado `profile-photos` e confira as políticas de Storage.
7. Implemente as operações administrativas restantes descritas em `supabase/functions/README.md` antes da publicação.

## Configurar CAPTCHA (Cloudflare Turnstile)

1. No Cloudflare Dashboard, abra **Turnstile**, crie um widget e autorize `localhost` e o domínio de produção.
2. Copie a **Site Key** para `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no `.env`. Essa chave pode ser usada no navegador.
3. No Supabase Dashboard, abra **Authentication > Bot and Abuse Protection**, ative CAPTCHA, selecione **Turnstile** e cole a **Secret Key** do widget.
4. Para proteger também as Edge Functions públicas, cadastre a mesma chave secreta como `CAPTCHA_SECRET` nos secrets das Functions. Nunca use essa chave em uma variável `NEXT_PUBLIC_*`.

O `.env` já contém a URL e a chave publicável do projeto Supabase. O valor de exemplo de `CAPTCHA_SECRET` precisa ser substituído antes de habilitar a validação.

## Arquitetura e ameaças

O navegador usa somente chave publicável. Dados da titular são protegidos por ownership + RLS. Produtos, hashes, lotes e papéis administrativos ficam no schema `private`. Ativação ocorre numa operação transacional server-side. A consulta pública passa por Edge Function e deve receber somente um DTO derivado do consentimento.

A auditoria de fundação, o diagrama de dados, as máquinas de estado, o mapa de visibilidade e os portões de validação estão em [`docs/foundation-stage-1.md`](docs/foundation-stage-1.md).

O escopo funcional proposto para o primeiro lançamento, incluindo limites, regras operacionais, retenção e decisões pendentes, está em [`docs/product-scope-v1.md`](docs/product-scope-v1.md).

Os resultados das migrations remotas, testes RLS com duas usuárias, revisão de grants e Advisors estão em [`docs/stage-2-database-rls-report.md`](docs/stage-2-database-rls-report.md).

A execução da fase 2 funcional — múltiplos perfis, painel persistente, publicação e bloqueio — está registrada em [`docs/phase-2-panel-report.md`](docs/phase-2-panel-report.md).

A implementação e configuração de Auth, cookies, Turnstile, recuperação de senha e MFA estão registradas em [`docs/stage-3-auth-report.md`](docs/stage-3-auth-report.md).

O fluxo transacional de ativação, os limites de tentativas e os testes da etapa 4 estão registrados em [`docs/stage-4-activation-report.md`](docs/stage-4-activation-report.md).

A consulta pública por código e NFC, a projeção de visibilidade e os controles de abuso da etapa 5 estão registrados em [`docs/stage-5-public-emergency-report.md`](docs/stage-5-public-emergency-report.md).

A administração segura de lotes e produtos está registrada em [`docs/stage-6-admin-report.md`](docs/stage-6-admin-report.md).

Exportação e exclusão da conta estão registradas em [`docs/stage-7-data-rights-report.md`](docs/stage-7-data-rights-report.md).

O fechamento funcional, jurídico e de QA da fase 8, incluindo bloqueios objetivos para publicação, está em [`docs/stage-8-readiness-report.md`](docs/stage-8-readiness-report.md).

Principais ameaças: enumeração de códigos, roubo de token NFC, acesso horizontal, elevação a admin, vazamento em logs/cache, publicação involuntária e abuso de endpoints. Controles previstos: códigos aleatórios, hashes, RLS, privilégios mínimos, MFA AAL2 administrativo, respostas uniformes, rate limit/CAPTCHA, `no-store`, ausência de analytics e publicação opt-in campo a campo.

## Antes de produção

- Validar os fluxos completos com dados fictícios, incluindo sessão expirada, perda de conexão e reenvio.
- Executar testes negativos de RLS com duas usuárias e `anon`, testes de abuso e acessibilidade.
- Rodar Security Advisor e Performance Advisor e corrigir alertas aplicáveis.
- Configurar retenção, backups/restauração, SMTP e rotação de segredos.
- Revisar os textos jurídicos com profissional especializada.
- Validar CSP, HSTS, framing, CORS exato e `sos.resolveuapp.com.br` na publicação.

Este é um MVP de validação local, não uma declaração de conformidade ou prontidão para armazenar dados reais.
