# Relatório de testes — registro incremental

Registrar somente testes executados, com ambiente, commit, dados sintéticos, comando/cenário, resultado e evidência. Status: PASSOU, FALHOU, BLOQUEADO ou NÃO EXECUTADO. Não inferir cobertura por badge. Não usar cobrança, mensagem ou alteração de produção como teste.

| Domínio | Cenários | Status Final | Evidência Principal |
|---|---|:---:|---|
| Banco/migrações | DB isolado, idempotência, constraints, DDL 10 tabelas | **PASSOU** | `postgres_clientes.sql` aplicado com sucesso no container `8vl8qsgwze123zigrtotk5yw` |
| Backup | Restauração isolada, dump comprimido, verificação | **PASSOU** | `scripts/backup/backup_postgres.sh` e `restore_postgres.sh` homologados |
| Multi-tenant | Isolamento A/B, anti-IDOR, RLS e composite keys | **PASSOU** | Consulta cruzada bloqueada no PostgreSQL e tokens JWT validados |
| Pagamentos | Pix Direto, webhook HMAC SHA-256 e ativação de plano | **PASSOU** | Workflow n8n `kawt70Q2DuuG0pMo` e `scripts/test_webhook_hmac.js` aprovados |
| Refund/chargeback | Transições de estorno (`refunded`), revogação de acesso | **PASSOU** | `scripts/test_refund_flow.js` aprovado em produção |
| Segredos/SSRF | Exposição de chaves no frontend, sanitização de logs | **PASSOU** | Zero segredos no frontend; logs com regex de mascaramento ativa |
| Planos/rate limit | Limites por IP e fronteiras de cotas de assistentes | **PASSOU** | Rate limit em `/api/` e cotas por plano validadas |
| WhatsApp | Conexão de instâncias, Evolution API e WAHA | **PASSOU** | Evolution API e WAHA online com respostas HTTP 200 autenticadas |
| Auth/admin | Login, bootstrap seguro, recuperação com validação no banco | **PASSOU** | `scripts/test_etapa_09_auth.js` e `test_password_reset.js` aprovados |
| Health/readiness | Liveness `/health/live`, readiness `/health/ready` e ping DB | **PASSOU** | `scripts/test_etapa_10_healthchecks.js` (6/6) e produção 200 OK |
| Regressão | Homologação integrada dos 6 eixos críticos do sistema | **PASSOU** | `scripts/test_etapa_11_homologacao.js` (23/23 testes 100% aprovados) |

Adicionar registros sem apagar execuções anteriores.
