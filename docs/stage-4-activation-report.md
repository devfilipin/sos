# Etapa 4 — ativação segura do produto

Revalidada em 30 de agosto de 2026 após a implementação de múltiplos perfis.

## Entregue

- `/ativar` chama a Edge Function autenticada `activate-product` e apresenta envio, sucesso e erro uniforme.
- Código público e segredo são validados no navegador e no servidor.
- A transação exige um perfil pertencente à responsável, vincula produto e perfil, invalida o segredo e cria a projeção autenticada do produto.
- Produtos ativos, bloqueados, revogados ou com segredo inválido não podem ser ativados novamente.
- Limite de 5 tentativas por conta e 20 por origem em 15 minutos. A origem é guardada apenas como SHA-256 com pepper da chave secreta do ambiente.
- A auditoria não registra códigos nem segredos.
- Tentativas de ativação são eliminadas automaticamente após 90 dias, conforme o escopo aprovado.

## Validação

- Contratos automatizados cobrem integração, autenticação, limites, anonimização, lock, invalidação, vínculo explícito e retenção.
- O teste SQL remoto cobre vínculo cruzado negado, ativação válida, tentativa de reuso, projeção e auditoria; roda em transação revertida e não deixa dados de teste.
- A Edge Function é publicada com verificação de JWT ativa.
- Migration `20260830224800_activation_attempt_retention.sql` aplicada ao projeto `sos`.

## Operação

Monitore o volume de `rate_limited` sem copiar payloads para logs. O Security Advisor mantém apenas os três avisos intencionais das RPCs autenticadas da fase 2; o Performance Advisor informa índices ainda sem uso suficiente porque o banco não possui tráfego real.
