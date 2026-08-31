# Resolveu SOS — relatório da etapa 2

Data da execução: 21 de agosto de 2026.

## Ambiente

- Projeto Supabase: `sos`.
- Estado inicial confirmado: projeto saudável, zero migrations, zero usuários e nenhuma tabela da aplicação.
- O projeto configurado no `.env` foi comparado com o projeto selecionado antes de qualquer escrita.
- Nenhum dado real ou usuário real foi utilizado.

## Migrations aplicadas

1. `initial_schema`
2. `server_functions`
3. `harden_public_write_surface`
4. `harden_profile_creation`

As migrations adicionais restringem escrita por coluna, bloqueiam publicação direta, impedem consentimento criado diretamente pelo cliente, protegem privilégios padrão futuros e adicionam exclusão de foto limitada à pasta da própria usuária.

## Testes RLS reais

O arquivo [`tests/rls-negative.sql`](../tests/rls-negative.sql) cria três identidades fictícias dentro de uma transação, executa operações sob os papéis `authenticated` e `anon` e encerra com `ROLLBACK`.

Casos aprovados:

- usuária A lê apenas seus próprios registros;
- usuária A não lê nem exclui contatos da usuária B;
- usuária A não muda o próprio `user_id`;
- usuária A não altera diretamente produtos do schema privado;
- usuária A não publica o perfil diretamente;
- usuária A não fabrica evento de consentimento;
- perfil não pode nascer publicado pelo cliente;
- claim `user_metadata.role=admin` não amplia acesso;
- pasta de foto da usuária B não aceita upload da usuária A;
- `anon` não lê perfis médicos nem produtos vinculados;
- `user_products` respeita ownership;
- policies de Storage incluem `SELECT`, `INSERT`, `UPDATE` e `DELETE` por pasta da titular.

Após o teste, o banco continuou com zero usuários e zero registros da aplicação.

## Grants e superfície pública

- Todas as cinco tabelas públicas têm RLS habilitada.
- `anon` não possui grant direto nas tabelas da aplicação.
- `authenticated` atualiza somente colunas editáveis.
- `status` e `published_at` não podem ser escritos diretamente pelo cliente.
- `consent_events` é somente leitura para a titular; inserção futura ocorrerá em operação server-side controlada.
- `user_products` é somente leitura para a titular.
- Novas tabelas e funções no schema público não recebem privilégios automáticos de `anon` ou `authenticated` pelas migrations da aplicação.

## Advisors

### Security Advisor

Zero alertas após as migrations.

### Performance Advisor

Somente avisos informativos de índices ainda não usados. Eles foram mantidos porque o banco está vazio e os índices cobrem chaves estrangeiras e consultas previstas. A ausência de uso neste momento não demonstra redundância. Referência: [Supabase Database Linter — unused index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Índices informados:

- `emergency_contacts_profile_id_idx`
- `product_batches_created_by_idx`
- `products_batch_id_idx`
- `products_owner_id_idx`
- `products_status_idx`

## Limites desta etapa

- O teste de exclusão física de arquivo não foi executado diretamente por SQL porque o Supabase bloqueia deleção direta em `storage.objects`; em produção ela deve passar pela Storage API. A policy de `DELETE` foi inspecionada no catálogo.
- Funções administrativas ainda não existem; portanto, o teste de execução de função admin por usuária comum será realizado na etapa de administração.
- A publicação e o consentimento estão bloqueados por padrão até suas operações server-side serem implementadas.

## Resultado

O marco de isolamento foi atingido: não há acesso anônimo direto aos dados médicos, e uma usuária autenticada não atravessa o limite de ownership nas tabelas ou no Storage testados.
