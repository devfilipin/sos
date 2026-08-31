# Resolveu SOS — escopo do primeiro lançamento

Status: **aprovado e congelado para a versão 1**  
Data: 30 de agosto de 2026

Este documento congela o escopo funcional do primeiro lançamento comercial. Mudanças posteriores entram como nova versão e não bloqueiam o piloto.

## 1. Público e objetivo

- A conta pertence a uma pessoa adulta responsável.
- A responsável pode criar perfis para si, para filhos menores e para outros dependentes sob sua responsabilidade.
- A responsável cadastra, controla e autoriza a publicação das informações de cada perfil.
- O Resolveu SOS auxilia terceiros a encontrar rapidamente informações declaradas pela titular adulta ou responsável.
- O produto não é prontuário, prescrição, documento médico nem serviço de emergência.
- A página pública funciona sem conta, instalação de aplicativo ou aceite de cookies.

## 2. Escopo comercial da versão 1

### Incluído

- Cadastro, confirmação de e-mail, login e recuperação de senha.
- Ativação de um chaveiro por código público e segredo de uso único.
- Múltiplos perfis de emergência por conta: perfil próprio, filhos e dependentes.
- Cada produto é vinculado a exatamente um perfil de emergência.
- Uma responsável pode administrar vários produtos e perfis.
- Consulta pública por NFC e por código público.
- Cadastro, pré-visualização, publicação e ocultação do perfil.
- Visibilidade configurada campo a campo, sempre privada por padrão.
- Até três contatos de emergência, ordenados pela titular.
- Bloqueio do produto por perda ou roubo.
- Exportação e exclusão da conta.
- MFA opcional para titulares e obrigatório para administradoras.
- Administração de lotes, produtos, bloqueio, revogação e substituição.

### Fora da versão 1

- Compartilhamento da gestão de um perfil entre duas ou mais contas.
- Convites para familiares, cuidadores ou responsáveis adicionais.
- Aplicativos nativos para Android ou iOS.
- Geolocalização, rastreamento, telemedicina ou acionamento automático de emergência.
- Integração com hospitais, ambulâncias, operadoras ou prontuários.
- Pagamentos, assinaturas e comércio eletrônico dentro do SOS.
- Edição de dados médicos pela ResolveuLab.
- Tradução automática e múltiplos idiomas na mesma página.
- Diretivas médicas ou jurídicas formalizadas pela plataforma.
- Analytics, publicidade ou replay de sessão na página de emergência.

## 3. Campos do perfil

Todos são opcionais. Para publicar, o perfil precisa ter ao menos o nome preferido e um dos seguintes: alergias, condições, medicamentos, necessidades de apoio, dispositivos ou contato de emergência.

| Campo | Limite da versão 1 | Publicação |
|---|---:|---|
| Nome preferido | 80 caracteres | opcional, recomendado |
| Foto | uma imagem, JPEG/PNG/WebP, até 5 MB | opcional |
| Data de nascimento | data válida, inclusive de menor | nunca publicada diretamente |
| Idade | derivada da data | opcional |
| Pronomes | 40 caracteres | opcional |
| Tipo sanguíneo | valores ABO/Rh | opcional, sempre como declaração pessoal |
| Alergias | 1.000 caracteres | opcional, máximo destaque |
| Condições relevantes | 2.000 caracteres | opcional |
| Medicamentos | 2.000 caracteres | opcional |
| Necessidades de apoio | 1.000 caracteres | opcional |
| Dispositivos médicos | 1.000 caracteres | opcional |
| Preferência sobre transfusão | 300 caracteres | opcional, declaração pessoal |
| Preferência sobre reanimação | 300 caracteres | opcional, sem valor de diretiva médica |
| Condição de doadora de órgãos | enumeração + observação curta | opcional, declaração pessoal |
| Operadora do plano | 100 caracteres | opcional; sem carteirinha |
| Idioma preferencial | uma opção | opcional |
| Outras orientações | 1.500 caracteres | opcional |
| Contatos | até 3; nome, vínculo e telefone | publicação individual |

Não serão coletados: CPF, RG, cartão SUS, endereço completo, geolocalização, documentos, laudos, exames, histórico clínico detalhado ou dados financeiros.

## 4. Regras do ciclo da responsável

1. Uma pessoa adulta cria a conta, confirma o e-mail e aceita os Termos.
2. A responsável cria um perfil próprio, de filho ou de dependente e declara seu vínculo e responsabilidade.
3. A responsável ativa o produto usando código público e segredo de uso único e escolhe o perfil ao qual ele será vinculado.
4. Cada perfil nasce como rascunho e inteiramente privado.
5. A responsável preenche os dados e escolhe a visibilidade de cada campo.
6. Salvar nunca publica nada automaticamente.
7. Antes da primeira publicação, a responsável vê uma prévia idêntica à página pública.
8. A publicação exige consentimento de dados sensíveis e autorização de publicação separados para o perfil selecionado.
9. Para menores e dependentes, a responsável declara possuir legitimidade para cadastrar e publicar os dados.
10. Ocultar tem efeito imediato e não exige justificativa.
11. Uma nova publicação exige nova confirmação da seleção pública vigente.
12. Campos alterados preservam sua visibilidade anterior; campos novos começam privados.

## 5. Estados e transições

### Perfil

- `draft`: configurável, nunca público.
- `published`: acessível somente se houver produto ativo e consentimentos vigentes.
- `hidden`: indisponível publicamente; pode ser republicado após nova confirmação.

### Produto

- `available`: fabricado, ainda não vinculado.
- `active`: vinculado e apto a consultar um perfil publicado.
- `blocked`: indisponível por perda, roubo ou ação de segurança; pode ser desbloqueado por fluxo autenticado.
- `revoked`: encerrado definitivamente; o token nunca volta a ser válido.

Transferência ou substituição nunca reutiliza o token NFC anterior. A operação exige administração, motivo e auditoria.

## 6. Regras operacionais

- A responsável pode ocultar qualquer perfil sob sua gestão sem contato com o suporte.
- O bloqueio por perda ou roubo é imediato e pode ser solicitado no painel.
- Desbloqueio pela responsável exige sessão recente; casos suspeitos são tratados pelo suporte.
- Revogação, substituição e transferência são ações administrativas.
- A ResolveuLab vê somente o mínimo necessário da responsável e do perfil para operar o produto.
- Administradoras não visualizam dados médicos por padrão.
- Não haverá suporte que solicite senha, token NFC ou segredo de ativação.
- Códigos de ativação e tokens de fabricação são exibidos/exportados uma única vez.

## 7. Retenção e exclusão — proposta inicial

- Conteúdo do perfil: mantido enquanto a conta existir ou até solicitação de exclusão.
- Eventos técnicos da consulta pública: retenção máxima de 24 horas, sem conteúdo médico.
- Tentativas de ativação e eventos de segurança: 90 dias.
- Consentimentos e auditoria administrativa: 5 anos após encerramento da conta, com minimização e fundamento jurídico revisado antes do lançamento.
- Conta excluída: perfil ocultado imediatamente; dados operacionais eliminados ou anonimizados em até 30 dias, salvo obrigação legal documentada.
- Backups: expiração natural conforme a janela de backup, sem restauração seletiva para uso operacional.

Os prazos acima precisam de validação jurídica antes de produção.

## 8. Suporte e privacidade — proposta inicial

- Canal único de suporte e privacidade: `resolveulab@gmail.com`.
- Atendimento inicial por e-mail, em dias úteis.
- Incidente de segurança recebe prioridade e procedimento próprio.
- Solicitações de titularidade iniciadas fora da conta exigem verificação de identidade proporcional ao risco.

O endereço precisa ser monitorado antes da publicação. Mensagens de privacidade devem receber identificação e tratamento separado dentro da mesma caixa postal.

## 9. Ambientes

- Desenvolvimento local: Supabase CLI/local, banco descartável e somente dados fictícios.
- Produção: único projeto Supabase hospedado, atualmente denominado `sos`, com dados reais, secrets, backups e monitoramento.
- Não haverá projeto remoto separado de homologação por decisão da responsável pelo produto.
- Toda migration deve passar primeiro no banco local vazio, nos testes automatizados e em revisão manual antes de chegar ao projeto hospedado.
- Testes destrutivos, seeds e experimentos são proibidos no projeto hospedado após a entrada de dados reais.
- `sos.resolveuapp.com.br` aponta somente para a aplicação de produção.
- A ausência de homologação aumenta o risco de indisponibilidade e rollback; essa decisão fica registrada e deve ser reavaliada antes de ampliar o piloto.

## 10. Critérios para considerar a Fase 1 encerrada

- Escopo incluído e excluído aprovado.
- Campos e limites aprovados.
- Ciclo da responsável e máquinas de estado aprovados.
- Política operacional de perda, bloqueio, transferência e suporte aprovada.
- Retenção inicial encaminhada para revisão jurídica.
- Estratégia de ambiente único hospedado aceita, com validação local obrigatória.
- Alterações posteriores registradas como nova versão do escopo.

## 11. Decisões aprovadas

1. A versão 1 aceita perfis próprios, de filhos e de dependentes, administrados por uma conta adulta responsável.
2. `resolveulab@gmail.com` será o canal único de suporte e privacidade no lançamento.
3. Haverá apenas um projeto Supabase hospedado, usado em produção; desenvolvimento e validação de migrations usam ambiente local descartável.

Mudanças nesses pontos exigem nova versão deste documento.

## 12. Impacto obrigatório na Fase 2

- Remover a restrição de um único `emergency_profile` por `user_id`.
- Introduzir vínculo explícito entre a conta responsável e cada perfil, com tipo de vínculo (`self`, `child`, `dependent`).
- Vincular cada produto a um `emergency_profile_id`, mantendo também a conta responsável para autorização e auditoria.
- Atualizar RLS para validar o vínculo da responsável, e não presumir que o perfil representa a própria usuária.
- Atualizar consentimentos para identificar o perfil ao qual cada autorização se refere.
- Atualizar exclusão, exportação e transferência para contemplar todos os perfis sob gestão da conta.
- Criar testes negativos que impeçam uma conta de acessar ou vincular produtos aos perfis de outra responsável.
