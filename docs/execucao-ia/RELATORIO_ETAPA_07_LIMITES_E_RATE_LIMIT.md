# Relatório de Auditoria e Correção — Etapa 07: Limites por Plano e Rate Limit

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 07 — Limites por Plano e Rate Limit  
> **Data:** 2026-11-27  
> **Status da Etapa 07:** CONCLUÍDA E VALIDADA  
> **Autoridade:** JR (Proprietário do Produto)  
> **Skills Aplicadas:** `backend-multi-tenant-and-security` e `security-and-hardening`  

---

## 1. Objetivo da Etapa 07

Auditar a consistência das regras e limites dos planos contratados entre banco de dados (Supabase `plans`), backend Node.js (`server.js`) e interface do usuário, assegurando que limites de assistentes, conexões de API, funcionalidades e rate limiting sejam rigorosamente aplicados no servidor de forma determinística e imune a bypass via cliente.

---

## 2. Diagnóstico e Fragilidades Encontradas

### 🔴 1. Bug Crítico de Escopo em `server.js` (`readRawBody`)
- **Problema:** Na linha 172 do `server.js`, havia uma checagem de rate limit colada indevidamente dentro do loop assíncrono de streaming (`for await (const chunk of req)`):
  ```javascript
  if (req.userPlan && req.userPlan.max_apis && entry.count > req.userPlan.max_apis * 15) ...
  ```
- **Causa Raiz:** A variável `entry` não existia no escopo de `readRawBody` (pertencia à função `rateLimit`). Caso `req.userPlan` fosse avaliado, o servidor lançava `ReferenceError: entry is not defined` derrubando a requisição.
- **Correção:** O trecho órfão foi removido do stream de leitura e a integridade de `readRawBody` foi restabelecida.

### 🟡 2. Agrupamento Indevido de Rate Limit sob Proxy Reverso
- **Problema:** A função `rateLimit(req)` utilizava exclusivamente `req.socket.remoteAddress`.
- **Impacto:** Como a aplicação roda atrás do `coolify-proxy`, o socket local recebia o IP interno da rede Docker do proxy. Isso significa que múltiplos clientes simultâneos na internet compartilhavam a mesma cota de 180 requisições/minuto, gerando falso positivo de erro 429 (*Too Many Requests*).
- **Correção:** O rate limiter foi tornado *proxy-aware*, inspecionando na ordem correta os cabeçalhos `cf-connecting-ip`, `x-forwarded-for` e fallback para `remoteAddress`.

---

## 3. Matriz de Catálogo e Limites por Plano

Auditamos o catálogo de planos ativo no Supabase (`public.plans`):

| Código | Nome | Preço de Teste | Max Assistentes | Max APIs | Planejamento Mensal | Capacidades Habilitadas |
|:---|:---|:---:|:---:|:---:|:---:|:---|
| `trial` | Teste Grátis (15 dias) | R$ 0,00 | 1 | 1 | Não | `["atendimento"]` |
| `essencial` | Essencial | R$ 1,00 * | 1 | 2 | Sim | `["atendimento", "cotacao"]` |
| `pro` | Pro | R$ 1,00 * | 3 | 4 | Sim | `["atendimento", "cotacao", "vendas", "crm_auto"]` |
| `empresa` | Empresa | R$ 1,00 * | 6 | 99 (Ilimitado) | Sim | `["atendimento", "cotacao", "vendas", "crm_auto", "marketing", "agendamento", "pos_venda"]` |

*\* Preços comerciais finais de lançamento homologados por JR: Essencial R$ 197 / Pro R$ 197 / Empresa R$ 397.*

---

## 4. Blindagem Backend Contra Burlar Limites (`enforcePlan`)

Asseguramos que o backend `server.js` valida os limites de forma determinística antes de qualquer escrita no PostgreSQL:
1. **Advisory Transaction Lock (`pg_advisory_xact_lock`):** Evita que requisições paralelas simultâneas criem múltiplos assistentes ou APIs acima do limite do plano (*race condition*).
2. **Validação de Capacidades:** Impede que um cliente no plano `trial` ou `essencial` envie payloads com permissões avançadas (ex: `vendas`, `crm_auto`).
3. **Bloqueio de Planejamento Mensal:** Bloqueia endpoints de metas mensais para planos sem essa prerrogativa.

---

## 5. Evidências de Teste Automatizado

Executamos a bateria de testes em [test_plan_limits_and_ratelimit.js](file:///c:/Users/Admin/Downloads/AGÊNCIA%202.7/PROJETOS%20DA%20AGÊNCIA/APP%20-%20ATENDEJA/scripts/test_plan_limits_and_ratelimit.js):

- [x] **Extração de IP via `x-forwarded-for`:** Resolveu corretamente `177.18.25.10`.
- [x] **Precedência do `cf-connecting-ip`:** Resolveu corretamente `201.55.88.99`.
- [x] **Barreira do Rate Limiter:** Permitiu até 180 requisições e bloqueou a 181ª com HTTP 429.
- [x] **Stream Parsing:** `readRawBody` processou streams sem nenhum erro de escopo ou exceção.
- [x] **Fronteira do Plano Trial:** 1 assistente permitido; 2º assistente bloqueado com HTTP 403; metas mensais bloqueadas com HTTP 403.
- [x] **Fronteira do Plano Pro:** 3 assistentes permitidos; 4º assistente bloqueado com HTTP 403; metas mensais permitidas com HTTP 200.

**Resultado:** 6 / 6 testes aprovados com 100% de sucesso.

---

## 6. Critérios de Aceite da Etapa 07

- [x] Catálogo e limites backend consistentes entre Supabase, Node.js e banco dedicado.
- [x] Rate limiting operacional por IP real através do proxy reverso.
- [x] Bug crítico de escopo em `readRawBody` eliminado.
- [x] Limites comprovados por testes de fronteira independentes da interface.
