# Resolveu SOS — relatório da etapa 3

Data da execução: 21 de agosto de 2026.

Revalidada em 30 de agosto de 2026 após a implementação de múltiplos perfis.

## Implementado

- Supabase Auth com `@supabase/ssr` e chave publicável.
- Sessão armazenada e renovada por cookies.
- Proteção server-side usando `auth.getClaims()`.
- Cadastro por nome, e-mail e senha.
- Confirmação obrigatória de e-mail.
- Login e logout.
- Recuperação e redefinição de senha.
- Senha mínima de 12 caracteres no frontend e no Supabase.
- Mensagens genéricas no login e na recuperação.
- Turnstile em cadastro, login e recuperação.
- Callback PKCE com allowlist de retorno relativo para impedir open redirect.
- Criação automática de `public.profiles` após novo usuário do Auth.
- Painel e ativação protegidos por sessão autenticada.
- Administração bloqueada sem `app_metadata.role=admin` e sessão AAL2.
- MFA TOTP disponível para usuárias em `/seguranca`.
- Login detecta fator TOTP verificado e conduz a sessão de `aal1` para o desafio `aal2`.
- Administração sem `aal2` redireciona para confirmação MFA e retorna à rota solicitada.

## Configuração verificada no Supabase

- Cadastro de novas pessoas: habilitado.
- Login anônimo: desabilitado.
- Confirmação de e-mail: habilitada.
- CAPTCHA: habilitado com Cloudflare Turnstile.
- Site URL: `http://localhost:3000`.
- Redirect permitido: `http://localhost:3000/auth/callback`.
- Troca segura de e-mail: habilitada.
- Troca segura de senha: habilitada.
- Tamanho mínimo de senha configurado para 12 caracteres.

O domínio de produção deverá ser adicionado à allowlist somente quando a URL definitiva existir.

## Banco

Migration aplicada: `20260821184914_create_profile_on_signup.sql`.

A função de trigger fica no schema `private`, usa `security definer` com `search_path` vazio e não concede execução para `PUBLIC`, `anon` ou `authenticated`. O teste transacional comprovou que um usuário novo recebe exatamente um perfil e terminou com `ROLLBACK`.

## Segurança

- Nenhuma chave secreta é importada pelo frontend.
- O retorno após login aceita somente caminhos relativos da própria aplicação.
- O administrador não é reconhecido por `user_metadata`.
- A área administrativa exige simultaneamente papel em `app_metadata` e `aal2`.
- Recuperação sempre apresenta a mesma resposta, exista ou não uma conta.
- A autorização continua baseada em `app_metadata`, nunca em `user_metadata`.
- Os avisos atuais do Security Advisor pertencem às três RPCs intencionais da fase 2 e não ao Auth.
- Performance Advisor: apenas índices informativos em banco ainda sem tráfego.

## Testes

- Build de todas as rotas aprovado.
- Lint aprovado sem erros.
- 33 testes automatizados aprovados após a integração com a fase 2.
- Contratos verificados: cookies SSR, chave publicável, CAPTCHA nos três fluxos, senha de 12 caracteres, claims server-side, AAL2, MFA TOTP e proteção contra open redirect.

## Validação manual necessária

O fluxo completo de cadastro não foi automatizado porque exige resolver um CAPTCHA real e abrir um e-mail real. Antes da homologação, realizar manualmente:

1. cadastro com um e-mail de teste;
2. resolução do Turnstile;
3. abertura do e-mail de confirmação;
4. login e logout;
5. recuperação e redefinição de senha;
6. configuração e verificação de um autenticador TOTP.

Não há SMTP próprio configurado. O provedor padrão do Supabase pode servir à validação inicial, mas envio confiável de confirmação e recuperação precisa ser resolvido antes da publicação. O endereço `resolveulab@gmail.com` permanece como canal de suporte e privacidade; ele não substitui automaticamente um serviço de envio transacional.
