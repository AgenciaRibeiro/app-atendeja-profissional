# Relatório de Auditoria Técnica — Etapa 03: Segurança Multi-Tenant e Autorização

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 03 — Segurança Multi-Tenant e Autorização  
> **Data:** 2026-11-26  
> **Status da Etapa 03:** Concluída para Avaliação  
> **Autoridade:** JR (Proprietário do Produto)  
> **Skills Aplicadas:** `backend-multi-tenant-and-security` e `security-and-hardening`  

---

## 1. Objetivo da Etapa 03

Auditar a arquitetura de segurança, o isolamento entre empresas (multi-tenant), os mecanismos de autenticação e autorização, a resolução de tenant no servidor (anti-IDOR), a aplicação de Row Level Security (RLS) no banco de dados e a proteção de rotas administrativas da aplicação AtendeJá Profissional.

---

## 2. Diagnóstico da Arquitetura Multi-Tenant

### 2.1 Resolução de Sessão e Identidade (Anti-IDOR)
- **Validação de Token:** A função `authenticate(req)` valida o Bearer token JWT diretamente na API do Supabase Auth (`/auth/v1/user`), extraindo o `user.id` do contratante de forma confiável.
- **Derivação de Tenant no Servidor:** O `client.id` é consultado exclusivamente no Supabase através de `auth_user_id = user.id`. O cliente web **jamais envia `client_id`** em rotas de negócio.
- **Sanitização de Payloads:** A função `cleanPayload` descarta qualquer campo não previsto no catálogo de recursos (`RESOURCES`), garantindo que campos injetados pelo cliente (como `client_id` ou `created_at`) sejam sumariamente ignorados.
- **Avaliação:** **CONFORME**. O sistema não é vulnerável a IDOR por manipulação de parâmetros em requisições de clientes.

### 2.2 Isolamento de Dados no Banco Operacional (RLS em 2 Camadas)
- **Camada 1 (Aplicação):** A função `withTenant(clientId, action)` abre conexão dedicada do pool, inicia uma transação (`BEGIN`), define `SELECT set_config('app.current_client_id', $1, true)` com escopo estritamente local e encerra com `COMMIT` ou `ROLLBACK`.
- **Camada 2 (PostgreSQL):** Todas as 10 tabelas operacionais possuem `FORCE ROW LEVEL SECURITY` e a política `tenant_isolation` restringe operações à role `atendeja_app_runtime` validando `client_id = public.current_client_id()`.
- **Integridade Referencial Composta:** Tabelas filhas (`lead_messages` e `lead_history`) aplicam chaves estrangeiras compostas `FOREIGN KEY (client_id, lead_id) REFERENCES public.leads(client_id, id)`, impedindo tecnicamente que um tenant referencie leads de outro tenant.
- **Avaliação:** **CONFORME**. Isolamento robusto garantido no banco de dados mesmo em caso de falha de filtro na aplicação.

### 2.3 Controle de Acesso Administrativo
- **Verificação de Papel:** Rotas sob `/api/admin/*` executam `requireAdmin(req)`, que consulta a tabela `admin_users` no Supabase e exige `active = true` e `role IN ('founder', 'admin')`. Usuários comuns recebem `403 Acesso administrativo não autorizado`.
- **Bootstrap do Primeiro Fundador:** Protegido por comparação de tempo constante (`crypto.timingSafeEqual`) contra o token de ambiente `FOUNDER_BOOTSTRAP_TOKEN` e bloqueado permanentemente após o primeiro cadastro via índice único condicional `idx_admin_users_single_founder`.
- **Avaliação:** **CONFORME**.

---

## 3. Vulnerabilidades e Pontos de Atenção Identificados

Durante a auditoria estática e comportamental do código, identificamos 2 pontos que requerem atenção:

#### ⚠️ Ponto 1: Variável Fora de Escopo em `readRawBody` (`server.js:172`)
- **Código:**
  ```javascript
  if (req.userPlan && req.userPlan.max_apis && entry.count > req.userPlan.max_apis * 15) throw fail(429, "Limite de API do seu plano atingido");
  ```
- **Diagnóstico:** A variável `entry` pertence ao escopo da função `rateLimit` e não existe em `readRawBody`. Caso essa instrução seja alcançada em runtime, disparará `ReferenceError: entry is not defined`.
- **Recomendação:** Mover a verificação de limite de taxa por plano para a camada de autenticação pós-resolução do plano (`handleTenantData` ou middleware dedicado), removendo a linha inválida do loop de streaming.

#### ⚠️ Ponto 2: Persistência de Configurações Administrativas em Disco Efêmero (`server.js:516-517`)
- **Código:**
  ```javascript
  const API_CONNECTIONS_FILE = path.join(__dirname, "data", "admin_api_connections.json");
  const LP_CONFIG_FILE = path.join(__dirname, "data", "landing_page_config.json");
  ```
- **Diagnóstico:** As chaves de IA do painel admin e o layout customizado da landing page são salvos em arquivos JSON no diretório local do container. Se o container for recriado sem volume montado em `/app/data`, essas informações são perdidas.
- **Recomendação:** Em etapa futura de hardening (Etapa 06/10), migrar a persistência dessas configurações para tabelas dedicadas no Supabase Control Plane ou garantir a montagem de volume persistente no Coolify.

---

## 4. Matriz de Conformidade Atualizada

A matriz completa contendo os 11 requisitos de segurança e cenários de teste sintéticos foi atualizada e versionada em:
- [04_MATRIZ_SEGURANCA_MULTI_TENANT.md](file:///c:/Users/Admin/Downloads/AGÊNCIA%202.7/PROJETOS%20DA%20AGÊNCIA/APP%20-%20ATENDEJA/docs/auditoria-corretiva/04_MATRIZ_SEGURANCA_MULTI_TENANT.md)

---

## 5. Critérios de Aceite da Etapa 03

- [x] Derivação de usuário e tenant comprovada via sessão/Supabase.
- [x] Proteção anti-IDOR validada em rotas de dados e perfil.
- [x] RLS operacional e administrativo inspecionado e validado.
- [x] Integridade referencial composta confirmada no schema.
- [x] Gaps de código mapeados sem alterações destrutivas em produção.
