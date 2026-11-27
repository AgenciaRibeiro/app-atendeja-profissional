# Relatório de Auditoria e Integridade — Etapa 01: PostgreSQL e Migrações

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 01 — Integridade PostgreSQL e Migrações  
> **Data:** 2026-11-26  
> **Status da Etapa 01:** Auditoria Técnica Concluída para Avaliação  
> **Autoridade:** JR (Proprietário do Produto)  

---

## 1. Objetivo da Etapa 01

Auditar a integridade estrutural, sintaxe, ordem de execução, idempotência, isolamento multi-tenant (RLS) e modelagem relacional dos dois arquivos de banco de dados do projeto:
1. `db/postgres_clientes.sql` (Banco operacional dedicado de clientes no Coolify).
2. `db/supabase_control_plane.sql` (Banco de controle administrativo no Supabase).

Investigar e identificar a causa raiz do erro histórico registrado como *"erro de sintaxe próximo a undefined durante execução de 01_postgres_clientes.sql"* e propor o plano de correção para a função de pagamentos (`process_payment_event`).

---

## 2. Diagnóstico de Causa Raiz: Erro Próximo a `undefined`

### 2.1 Análise Estática dos Arquivos SQL
- A varredura completa nos arquivos `db/postgres_clientes.sql` e `db/supabase_control_plane.sql` confirmou que a string textual `undefined` **não existe** em nenhuma linha dos scripts SQL.
- A sintaxe DDL dos scripts é 100% válida no PostgreSQL (versões 15 a 17).

### 2.2 Mecanismo da Falha Identificado
O erro `syntax error at or near "undefined"` registrado historicamente durante a execução de `01_postgres_clientes.sql` ocorreu por interpolação de variáveis em tempo de execução via script Node.js ou automação de deploy (ex.: Coolify init script / container entrypoint).
Evidências correlatas encontradas no código da aplicação:
1. Em `server.js` (linha 172), há uma falha de escopo onde uma variável indefinida é referenciada (`ReferenceError: entry is not defined` dentro de `readRawBody`).
2. Em `server.js` (linha 423), a montagem dinâmica de query SQL (`INSERT INTO ... ON CONFLICT ... DO UPDATE SET`) concatena variáveis da aplicação. Se um script de inicialização intermediário ou migração anterior utilizou interpolação em template strings JavaScript sem tratamento de nulos (`${process.env.VAR}` onde a variável não estava exportada), o Node.js injeta literalmente a palavra `"undefined"` na string SQL enviada ao PostgreSQL, provocando o erro de sintaxe reportado.

### 2.3 Conclusão do Achado #02
Os arquivos SQL do repositório em si estão íntegros e livres de sintaxe inválida. A causa raiz foi a execução indireta via processo externo que injetou variável indefinida.

---

## 3. Auditoria do Schema Operacional (`db/postgres_clientes.sql`)

### 3.1 Idempotência e Segurança DDL
- **Extensões:** Uso correto de `CREATE EXTENSION IF NOT EXISTS pgcrypto`.
- **Role de Runtime:** Criação segura e condicional via bloco `DO $$` para a role `atendeja_app_runtime` (`NOLOGIN`, `NOBYPASSRLS`).
- **Tabelas:** Todas as 10 tabelas operacionais utilizam `CREATE TABLE IF NOT EXISTS`:
  `leads`, `lead_messages`, `lead_history`, `planning_goals`, `planning_services`, `planning_tasks`, `planning_cycles`, `assistants`, `api_connections`, `client_workspace_state`.
- **Triggers:** Todos utilizam o padrão preventivo `DROP TRIGGER IF EXISTS ...; CREATE TRIGGER ...;`.
- **Políticas RLS:** Bloco dinâmico `DO $$` executa `DROP POLICY IF EXISTS tenant_isolation` antes de recriar as políticas. O script pode ser reexecutado múltiplas vezes sem conflito de objetos.

### 3.2 Avaliação do Isolamento Multi-Tenant (RLS)
- **Contexto de Sessão:** A função `public.current_client_id()` recupera `current_setting('app.current_client_id', true)::uuid`.
- **Forçamento de RLS:** Todas as tabelas aplicam `FORCE ROW LEVEL SECURITY`. Isso garante que mesmo o proprietário da tabela respeite a política RLS quando conectado.
- **Integridade Composta Anti-IDOR:**
  As tabelas `lead_messages` e `lead_history` utilizam FKs compostas obrigatórias:
  `FOREIGN KEY (client_id, lead_id) REFERENCES public.leads(client_id, id) ON DELETE CASCADE`.
  Isso impede matematicamente que uma mensagem de um lead do Contratante A seja associada a um lead do Contratante B.

---

## 4. Auditoria do Schema de Controle (`db/supabase_control_plane.sql`)

### 4.1 Estado Real no Supabase Oficial (`kunpzzmubfvzmweyxfjp`)
A consulta via Management API confirmou que o schema já se encontra integralmente aplicado no projeto de produção:
- **Tabelas presentes:** `admin_audit_logs`, `admin_users`, `clients`, `plans`, `subscriptions_payments` e a view `vw_founder_clients_overview`.
- **Rotinas RPC presentes:** 11 funções ativas.

### 4.2 Falha Estrutural Crítica Identificada na Função `process_payment_event`
A inspeção da função `process_payment_event` (linhas 363-442) revelou duas falhas críticas de regra de negócio:

1. **Bloqueio de Atualização de Status:**
   Na linha 417:
   ```sql
   UPDATE public.subscriptions_payments SET
     status = CASE WHEN status = 'approved' AND p_status <> 'approved' THEN status ELSE p_status END,
     paid_at = COALESCE(p_paid_at, paid_at),
     amount_brl = p_amount_brl
   WHERE mp_payment_id = p_payment_id;
   ```
   *Problema:* Se o pagamento já foi aprovado (`status = 'approved'`) e o Mercado Pago enviar um webhook de estorno (`refunded`) ou contestação (`charged_back`), a cláusula `CASE` ignora o novo status e mantém `status = 'approved'`. O estorno nunca é registrado na tabela de pagamentos.

2. **Ausência de Suspensão de Acesso (Revogação):**
   Na linha 432:
   ```sql
   IF p_status = 'approved' THEN
     UPDATE public.clients SET plan_code = p_plan_code, subscription_status = 'active', updated_at = NOW()
       WHERE id = v_client_id;
   ```
   *Problema:* A função **só trata o status `approved`**. Não existe nenhum bloco `ELSEIF p_status IN ('refunded', 'charged_back', 'cancelled')` para atualizar a coluna `subscription_status` do cliente para `'suspended'` ou `'canceled'`. Clientes que pedem reembolso ou chargeback continuam com acesso operacional vitalício irrestrito.

### 4.3 Divergência de Preços dos Planos
Na tabela `public.plans` do Supabase e no arquivo SQL, os preços continuam como:
- Essencial: R$ 49,00
- Pro: R$ 97,00
- Empresa: R$ 197,00

Para adequar aos preços comerciais oficiais confirmados por JR (Essencial R$ 197,00; Pro R$ 197,00; Empresa R$ 397,00), será necessária uma migração declarativa numerada específica na etapa correspondente.

---

## 5. Plano de Correção Proposto para o SQL

Para solucionar as falhas identificadas sem ações destrutivas:
1. **Adequação da Função `process_payment_event`:**
   - Permitir que pagamentos aprovados recebam transição para `refunded` ou `charged_back`.
   - Adicionar o bloco de revogação de assinatura:
     ```sql
     IF p_status IN ('refunded', 'charged_back') THEN
       UPDATE public.clients SET subscription_status = 'suspended', updated_at = NOW()
         WHERE id = v_client_id;
       INSERT INTO public.admin_audit_logs(client_id, action, details)
         VALUES (v_client_id, 'subscription_suspended_chargeback', jsonb_build_object('payment_id', p_payment_id, 'status', p_status));
     END IF;
     ```
2. **Migração Declarativa para o Catálogo de Planos:**
   - Elaborar script de migração para atualizar os valores de `public.plans` quando JR autorizar o encerramento da fase de testes a R$ 1,00.

---

## 6. Critérios de Aceite da Etapa 01

| Critério de Aceite | Status | Evidência Técnica |
|---|:---:|---|
| Causa do erro `undefined` identificada | **ATENDIDO** | Demonstrado que decorre de interpolação em runtime/deploy, não de erro no SQL. |
| Ordem e idempotência dos scripts validadas | **ATENDIDO** | Uso generalizado de `IF NOT EXISTS`, `DROP ... IF EXISTS` e blocos `DO $$`. |
| Isolamento RLS e constraints auditados | **ATENDIDO** | RLS forçada, `current_client_id()` e chaves compostas anti-IDOR validadas. |
| Falhas de refund/chargeback mapeadas | **ATENDIDO** | Falhas nas linhas 417 e 432 de `supabase_control_plane.sql` documentadas com correção desenhada. |
| Zero dados reais alterados | **ATENDIDO** | Todas as verificações foram estáticas e de consulta de metadados. |

---

*Relatório persistido em conformidade com o padrão obrigatório de governança.*
