# Manual Definitivo de Arquitetura e Operação — AtendeJá Profissional

Autoridade do Projeto: JR  
Data de Conclusão: 27 de novembro de 2026  
Versão da Plataforma: 2.0.0 (Estabilizada e Auditada)  
Repositório: `https://github.com/AgenciaRibeiro/app-atendeja-profissional.git`  

---

## 1. Visão Geral da Arquitetura

O **AtendeJá Profissional** é uma plataforma multi-tenant projetada para prestadores autônomos e empresas de serviços técnicos (climatização, elétrica, marcenaria, pintura, etc.), integrando atendimento automatizado via WhatsApp, CRM Kanban de leads e geração determinística de orçamentos.

A arquitetura adota o modelo de **4 Camadas Estritas**:

```
[ WhatsApp do Cliente ] 
          │
          ▼
[ Gateway WhatsApp (Evolution API / WAHA) ]
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 1: Modelos de Linguagem (LLM)                        │
│ OpenAI (GPT-4o-mini), Groq (LLaMA 3.3), OpenRouter          │
│ • Interpreta intenção, extrai dados de triagem              │
│ • NUNCA calcula preços e NUNCA inventa disponibilidade      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 2: Extração Estruturada (JSON)                       │
│ • Valida parâmetros do serviço e preenche pendências (null) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 3: Backend Determinístico (Node.js / PostgreSQL)     │
│ • Autoridade Máxima Comercial                               │
│ • Calcula mão de obra, materiais e orçamentos determinísticos│
│ • Aplica isolamento multi-tenant por client_id              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 4: CRM Kanban & Persistência                         │
│ • Atualiza funil de leads sem duplicidade                   │
│ • Registra histórico de orçamentos e agendamentos           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes de Infraestrutura e Hospedagem

| Componente | Endereço / Identificador | Função |
|---|---|---|
| **Aplicação Principal** | `https://atendeja.minhaempresaautonoma.online` | Servidor Node.js, Frontend SPA, API e Dashboard |
| **Painel do Cliente** | `https://atendeja.minhaempresaautonoma.online/jr` | Redireciona via 302 para `/login-jr` -> `/gerenciar-jr` |
| **Painel Admin Master** | `https://atendeja.minhaempresaautonoma.online/atendeja` | Gestão de assinaturas, planos e configurações globais |
| **Servidor Coolify** | `https://coolify.minhaempresaautonoma.online` | Orquestrador Docker em VPS (`179.197.88.186`) |
| **PostgreSQL Dedicado** | Container `8vl8qsgwze123zigrtotk5yw` (`postgres:18-alpine`) | Banco `atendeja_clientes` com tabelas operacionais e RLS |
| **Supabase Control Plane** | Projeto `kunpzzmubfvzmweyxfjp` | Autenticação (`auth.users`), `clients` e `admin_users` |
| **Evolution API** | `https://evo.minhaempresaautonoma.online` | Gateway primário para instâncias de WhatsApp dos clientes |
| **WAHA** | `https://waha.minhaempresaautonoma.online` | Gateway de contingência / canal oficial do fundador |
| **n8n Automações** | `https://n8n.minhaempresaautonoma.online` | Orquestração do checkout Pix e notificações de pagamento |

---

## 3. Banco de Dados e Esquema Multi-Tenant

### 3.1 PostgreSQL Dedicado (`atendeja_clientes`)
Contém 10 tabelas operacionais blindadas com isolamento por `client_id`:
1. `leads`: Cadastro unificado de contatos e clientes finais.
2. `lead_messages`: Histórico detalhado de conversas no WhatsApp.
3. `lead_history`: Auditoria de movimentações e transições de status no funil.
4. `planning_goals`: Metas de faturamento e clientes por período.
5. `planning_services`: Catálogo de serviços e precificação base.
6. `planning_tasks`: Tarefas operacionais vinculadas aos atendimentos.
7. `planning_cycles`: Ciclos semanais e mensais de acompanhamento.
8. `assistants`: Configurações de Assistentes Virtuais (nome, nicho, prompt).
9. `api_connections`: Chaves e conexões seguras por empresa.
10. `client_workspace_state`: Estado consolidado do painel com controle de revisão (`revision`).

### 3.2 Supabase Control Plane
- `auth.users`: Identidades gerenciadas por OAuth (Google) e credenciais administrativas.
- `public.clients`: Vínculo entre auth user, plano contratado, status de assinatura e data de expiração.
- `public.admin_users`: Registro de administradores ativos com suporte à recuperação de senha.

---

## 4. Fluxo de Pagamentos e Checkout Pix

1. **Preços de Teste em Produção:**
   - Mantidos intencionalmente em **R$ 1,00** para os três planos (*Essencial*, *Pro* e *Empresa*) durante a fase de validação assistida.
2. **Método Exclusivo:**
   - **Pix Direto:** Cartão de crédito removido definitivamente por decisão estratégica de JR.
3. **Orquestração n8n:**
   - Workflow ativo: `AtendeJá — Mercado Pago (Pix Direto + Confirmação Automática + Evolution API)` (ID `kawt70Q2DuuG0pMo`).
   - Recebe webhook do Mercado Pago, valida pagamento e notifica o backend do AtendeJá.
4. **Segurança do Webhook:**
   - Notificações enviadas para `POST /api/webhooks/mercadopago`.
   - Exigem assinatura criptográfica **HMAC SHA-256** timing-safe validada sobre o corpo bruto através dos cabeçalhos `x-atendeja-signature` ou `x-webhook-signature`.
   - Transições suportadas: `approved` (ativa plano por 30 dias) e `refunded` / `charged_back` (revoga imediatamente).

---

## 5. Endpoints de Monitoramento e Healthchecks

- **Liveness (`GET /health/live` e `/api/health/live`):**
  - Retorna `200 OK` atestando que o processo Node.js está em execução.
- **Readiness (`GET /health/ready` e `/api/health/ready`):**
  - Executa consulta ativa `SELECT 1 AS ping` no PostgreSQL e checa chaves Supabase.
  - Retorna `200 OK` com latência em milissegundos se pronto; retorna `503 Service Unavailable` se o banco estiver fora do ar.
- **Healthcheck Geral (`GET /api/health` e `/health`):**
  - Utilizado pelo Docker/Coolify (`wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1`).
  - Reporta versão `2.0.0`, uptime e uso de memória RAM em megabytes.

---

## 6. Rotinas de Backup e Contingência

1. **Rotina de Backup PostgreSQL VPS:**
   - Script oficial: `scripts/backup/backup_postgres.sh`.
   - Gera dumps comprimidos (`atendeja_clientes_backup_*.sql.gz`) com retenção de 7 dias e cópia externa.
2. **Rotina de Recuperação:**
   - Script oficial: `scripts/backup/restore_postgres.sh`.
   - Testada e validada com integridade total de schema e dados.
3. **Workflows n8n:**
   - Backups versionados em JSON salvos na pasta `backups/n8n/`.

---

## 7. Procedimento de Deploy e Atualização

Para promover alterações com segurança:
```bash
# 1. Testes locais
node scripts/test_etapa_11_homologacao.js

# 2. Push para GitHub
git push origin governance/autonomia-auditoria-corretiva
git checkout main && git merge governance/autonomia-auditoria-corretiva && git push origin main

# 3. Disparo no Coolify via SSH
ssh root@179.197.88.186 "bash /tmp/deploy.sh"
```
A aplicação iniciará o novo container e transitará para `healthy` somente após o readiness probe aprovar a conexão com o banco.
