# Etapa 7 — exportação e exclusão da conta

Executada em 30 de agosto de 2026.

## Entregue

- Rota autenticada `/conta` para dados e privacidade.
- Exportação JSON de conta, perfis administrados, contatos, produtos e consentimentos, sem segredos ou hashes de fabricação.
- Exclusão exige sessão iniciada nos últimos 10 minutos e a frase `EXCLUIR MINHA CONTA`.
- Antes da exclusão Auth, todos os perfis são ocultados e produtos revogados.
- Fotos são removidas pela Storage API antes de apagar o usuário.
- Contas administrativas são encaminhadas ao suporte para preservar integridade da auditoria.
- Falhas parciais mantêm perfis ocultos e produtos revogados, permitindo repetição segura da remoção.

## Validação

- Migration `20260830230735_phase_7_data_rights.sql` aplicada ao projeto `sos`.
- `export-my-data` e `delete-my-account` versão 1 ativas, ambas com JWT obrigatório.
- Teste remoto transacional aprovou exportação, preparação da exclusão e ocultação; terminou em rollback.
- 41 testes, lint e build de produção aprovados.

## Observação jurídica

O escopo prevê possível retenção minimizada de consentimentos por cinco anos, mas o fundamento e o formato ainda dependem de revisão jurídica. A implementação atual privilegia eliminação por cascata na exclusão da conta e não cria arquivo paralelo de dados pessoais sem base aprovada.
