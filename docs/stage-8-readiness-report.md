# Fase 8 — fechamento funcional, jurídico e QA

Data da revisão: 30 de agosto de 2026.

## Resultado

A fase 8 foi concluída para validação local. A aplicação compila, os contratos automatizados passam e a migration desta fase foi aplicada ao projeto Supabase `sos`. Isso não significa autorização para uso com dados reais nem prontidão jurídica para publicação.

## Entregas

- Desbloqueio de produto pela titular exige sessão autenticada há no máximo 10 minutos, valida ownership e registra evento de auditoria.
- Aceite de cadastro passou a registrar versões de Termos e Privacidade e confirmação de maioridade em tabela privada.
- Criadas minutas versionadas de Termos de Uso, Aviso de Privacidade e Consentimento, todas claramente marcadas para revisão jurídica.
- Canal de suporte e privacidade unificado em `resolveulab@gmail.com`.
- Criada rota autenticada `/produtos` para bloqueio e desbloqueio de chaveiros.
- Criada prévia privada antes da publicação. A rota `/preview?perfil=<id>` usa o mesmo componente e a mesma seleção positiva de campos da página SOS.
- Incluída observação opcional para a declaração de doação de órgãos.
- Navegação do painel agora expõe Produtos, Segurança e Conta e privacidade.

## Banco e segurança

Migration aplicada: `20260830231437_phase_8_legal_and_self_service.sql`.

O teste transacional remoto confirmou, com rollback, o registro do aceite jurídico e o desbloqueio somente pela titular com autenticação recente. Os Advisors foram executados após a migration:

- Segurança: quatro avisos sobre RPCs `SECURITY DEFINER` executáveis por `authenticated`. A exposição é intencional para publicação, ocultação, bloqueio e desbloqueio. Todas usam `search_path` vazio, verificam `auth.uid()` e ownership; o desbloqueio também valida `auth_time`. O risco deve ser reavaliado antes de ampliar qualquer RPC.
- Performance: sete índices ainda sem uso. Como o banco tem pouco tráfego e esses índices apoiam consultas operacionais, FKs e expurgo, não foram removidos nesta etapa.

Referências dos avisos: [funções SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [índices sem uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Evidência automatizada

- ESLint: sem erros.
- Build de produção: concluído.
- Testes: 45 de 45 aprovados, incluindo o contrato da prévia privada.
- Teste remoto: concluído em transação e revertido, sem dados fictícios residuais.

## Bloqueios antes da publicação

1. Revisão das três minutas por profissional de direito e definição formal do controlador/encarregado ou enquadramento aplicável. A LGPD compilada está no [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), e a ANPD mantém [orientações sobre agentes de tratamento e encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-e-do-encarregado).
2. Configurar SMTP transacional. O Gmail de contato não é, por si só, infraestrutura confiável para confirmação, recuperação e alertas de segurança.
3. Configurar Turnstile real, `CAPTCHA_SECRET`, origens exatas em `ALLOWED_ORIGINS` e URLs permitidas no Supabase Auth.
4. Confirmar backups, restauração testada, retenção, alertas e monitoramento do projeto único de produção.
5. Criar o primeiro administrador com procedimento auditável e MFA AAL2.
6. Executar validação manual em celular real: cadastro, confirmação de e-mail, login/MFA, ativação, publicação, consulta por NFC/código, bloqueio, reautenticação e desbloqueio, exportação e exclusão.
7. Definir o procedimento operacional de substituição e transferência. Transferência silenciosa de ownership continua proibida; produto antigo deve ser revogado e a nova credencial emitida.
8. Só então executar a fase 9: publicar, associar `sos.resolveuapp.com.br`, validar TLS/CSP/HSTS/CORS e fazer smoke test de produção.

## Decisão de ambiente

Conforme decisão do projeto, haverá somente o Supabase remoto `sos` para produção. Para reduzir o risco dessa escolha, migrations devem continuar sendo testadas localmente, mudanças destrutivas precisam de backup verificável e os testes de validação devem usar apenas dados fictícios até a liberação formal.
