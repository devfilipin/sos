# Etapa 6 — administração de lotes e produtos

Executada em 30 de agosto de 2026.

## Entregue

- Área administrativa real, sem métricas ou produtos fictícios.
- Acesso exige `app_metadata.role=admin` e sessão MFA `aal2`.
- Geração transacional de lotes de 1 a 100 produtos.
- Código público, segredo de ativação e token NFC aleatórios; segredo e token são exibidos uma única vez.
- Banco guarda somente hash bcrypt do segredo e SHA-256 do token NFC.
- Bloqueio, desbloqueio e revogação exigem motivo e respeitam a máquina de estados.
- Trilha administrativa imutável registra ator, ação, recurso, motivo e horário, sem dados médicos.
- Funções administrativas permanecem com JWT obrigatório.

## Validação

- Migration `20260830225957_phase_6_admin_operations.sql` aplicada ao projeto `sos`.
- Teste remoto transacional aprovou lote, bloqueio, desbloqueio, revogação e auditoria; terminou em rollback.
- 38 testes automatizados, lint e build de produção aprovados.

## Limites

Transferência e substituição física exigem desenho operacional próprio e não reutilizam credenciais antigas. Exportação e exclusão da conta continuam para a fase seguinte. O primeiro papel admin deve ser atribuído exclusivamente por operação segura no Supabase, nunca pelo frontend.
