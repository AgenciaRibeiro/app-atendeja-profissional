# Matriz de Segurança Multi-Tenant e Autorização — AtendeJá Profissional

- **Data da Auditoria:** 2026-11-26
- **Status:** AUDITADA E AVALIADA (Etapa 03)
- **Autoridade:** JR (Proprietário do Produto)
- **Regras:** `RULE[.agents/rules/multi-tenant.md]` e `RULE[.agents/rules/security.md]`
- **Skills Aplicadas:** `backend-multi-tenant-and-security`

---

## 1. Matriz de Requisitos e Evidências

| ID | Área | Requisito / Verificação | Comportamento Esperado | Comportamento Observado | Evidência no Código / Banco | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **SEC-01** | **Identidade** | Identidade do usuário derivada exclusivamente de sessão validada. | Rejeitar chamadas anônimas ou com tokens adulterados/expirados com 401. | Função `authenticate(req)` consulta `auth/v1/user` no Supabase via Bearer token; valida formato UUID. | `server.js:238-245` | **VALIDADO** |
| **SEC-02** | **Tenant (Anti-IDOR)** | Resolução de `client_id` no servidor a partir da sessão autenticada. | Rejeitar ou ignorar qualquer `client_id` enviado no payload ou query; impedir acesso a outros tenants. | `getClient(user)` consulta `clients` por `auth_user_id = user.id`. Em `/api/data/*`, `cleanPayload` remove qualquer campo fora de `RESOURCES`; backend injeta `client.id` resolvido. | `server.js:261-277`, `server.js:343-357`, `server.js:416` | **VALIDADO** |
| **SEC-03** | **RLS Operacional** | RLS habilitado e forçado em todas as tabelas operacionais do cliente. | Consultas sem contexto de tenant retornam 0 linhas; cliente A jamais lê ou altera dados do cliente B. | Todas as 10 tabelas operacionais possuem `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`. Política `tenant_isolation` restringe a `client_id = public.current_client_id()`. | `db/postgres_clientes.sql:206-260` | **VALIDADO** |
| **SEC-04** | **Contexto Transacional** | Isolamento de sessão no pool de conexões PostgreSQL. | `app.current_client_id` restrito à transação local (`is_local = true`); sem vazamento entre conexões reutilizadas. | `withTenant` executa `BEGIN`, `SELECT set_config('app.current_client_id', $1, true)`, `COMMIT`/`ROLLBACK` e `release()`. | `server.js:290-305` | **VALIDADO** |
| **SEC-05** | **Integridade Referencial Composta** | Vínculo cruzado entre entidades pertencentes a tenants diferentes impedido no schema. | Impossível criar mensagem ou histórico referenciando lead de outro tenant. | `lead_messages` e `lead_history` usam FKs compostas `FOREIGN KEY (client_id, lead_id) REFERENCES public.leads(client_id, id)`. RLS também valida via `EXISTS`. | `db/postgres_clientes.sql:79-81`, `93-95`, `225-241` | **VALIDADO** |
| **SEC-06** | **RLS Supabase Control Plane** | Isolamento multi-tenant nas tabelas administrativas e cadastrais. | Contratante só acessa seu próprio registro de `clients` e seus próprios `subscriptions_payments`. | RLS ativo em `clients` (`auth.uid() = auth_user_id OR is_admin()`) e `subscriptions_payments` (subquery validando `c.auth_user_id = auth.uid()`). | `db/supabase_control_plane.sql:460-490` | **VALIDADO** |
| **SEC-07** | **Acesso Administrativo** | Rotas administrativas `/api/admin/*` protegidas contra acesso de clientes. | Usuários autenticados sem role de `founder` ou `admin` recebem 403. | `requireAdmin(req)` consulta `admin_users` exigindo `active = true` e `role IN ('founder', 'admin')`. | `server.js:247-259` | **VALIDADO** |
| **SEC-08** | **Bootstrap Seguro** | Cadastro do primeiro fundador blindado contra usurpação. | Requer token secreto forte via timing-safe compare; após primeiro fundador cadastrado, bloqueia com 409. | `handleAdmin (bootstrap)` compara `x-founder-bootstrap-token` com `crypto.timingSafeEqual` e bloqueia via `admin_users_single_founder` index e RPC `bootstrap_first_founder`. | `server.js:808-819`, `db/supabase_control_plane.sql:278-303` | **VALIDADO** |
| **SEC-09** | **Limites e Planos** | Aplicação determinística de limites de plano no backend. | Bloquear criação de assistentes, conexões ou recursos acima da cota contratada. | `enforcePlan` adquire lock transacional consultivo (`pg_advisory_xact_lock`), conta registros e compara com limites de `plans`. | `server.js:364-390` | **VALIDADO** |
| **SEC-10** | **Mascaramento e Sanitização** | Chaves e segredos jamais expostos ou persistidos indevidamente. | Mascarar chaves de API (`••••••••ABCD`); filtrar senhas e tokens no workspace. | `maskKey` exibe apenas 4 primeiros e 4 últimos dígitos; `sanitizeWorkspaceValue` remove chaves sensíveis recursivamente até profundidade 12. | `server.js:463-477`, `server.js:610-615` | **VALIDADO** |
| **SEC-11** | **Escopo de Variável em Streaming** | Validação sintática do pipeline de streaming de corpo. | `readRawBody` deve processar chunks sem erros de escopo. | **PONTO DE ATENÇÃO:** Linha 172 referencia `entry.count` fora do escopo de `rateLimit`, provocando `ReferenceError` se acionada. | `server.js:172` | **CORREÇÃO PENDENTE** |

---

## 2. Cenários de Teste Sintéticos Mínimos

1. **Cenário A/B: Tenant A tentando acessar registros do Tenant B:**
   - *Ação:* Requisição `GET /api/data/leads` autenticada com token do Tenant A.
   - *Resultado Esperado:* Apenas leads associados ao `client_id` do Tenant A retornados.
   - *Mecanismo Garantidor:* Backend aplica `WHERE client_id = $1` derivado da sessão E PostgreSQL filtra via política RLS `tenant_isolation`.
2. **Cenário de Manipulação de ID (IDOR):**
   - *Ação:* Tenant A envia `PATCH /api/data/leads/<ID_DO_TENANT_B>`.
   - *Resultado Esperado:* Retorno `404 Registro não encontrado`.
   - *Mecanismo Garantidor:* Query `UPDATE public.leads ... WHERE id = $1 AND client_id = $2`. O `rowCount` é 0, retornando 404 sem revelar existência.
3. **Cenário de Vínculo Cruzado de Chave Estrangeira:**
   - *Ação:* Inserção direta de mensagem com `client_id` do Tenant A e `lead_id` pertencente ao Tenant B.
   - *Resultado Esperado:* Violação de chave estrangeira `fk_lead_messages_tenant_lead` E violação de política RLS `tenant_isolation` (cláusula `EXISTS`).
4. **Cenário de Escalação de Privilégio (Admin Bypass):**
   - *Ação:* Usuário com conta de cliente comum envia `GET /api/admin/clients`.
   - *Resultado Esperado:* Retorno imediato `403 Acesso administrativo não autorizado`.
