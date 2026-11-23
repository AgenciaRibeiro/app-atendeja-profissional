# Arquitetura Híbrida de Bancos — AtendeJá Profissional

O sistema separa **governança do Fundador** e **dados operacionais dos contratantes** em dois bancos:

## 1. Supabase (`https://kunpzzmubfvzmweyxfjp.supabase.co`) — Dashboard de Admin (Controle do Fundador)
Arquivo: [`supabase_control_plane.sql`](./supabase_control_plane.sql)

Responsável por:
- **Autenticação Google (OAuth)** dos contratantes e administradores (`auth.users`).
- **Administradores do sistema** (`public.admin_users` + função `public.is_admin()`): controla acesso total ao Dashboard Admin do Fundador com RLS.
- **Catálogo de planos** (`public.plans`: `trial` 15 dias, `essencial`, `pro`, `empresa`).
- **Cadastro mestre dos clientes/contratantes** (`public.clients`) com empresa, e-mail Google, logo, rede social e status da assinatura.
- **Pagamentos e renovações Mercado Pago** (`public.subscriptions_payments`).
- **Auditoria e visão do Fundador** (`public.admin_audit_logs` e view `public.vw_founder_clients_overview`).
- Protegido com **RLS (Row Level Security)** para que cada cliente veja apenas o próprio cadastro/pagamentos e administradores ativos (`public.is_admin()`) gerenciem toda a carteira.

## 2. PostgreSQL Dedicado no Coolify — Dados dos Contratantes
Arquivo: [`postgres_clientes.sql`](./postgres_clientes.sql)

Responsável pelos dados operacionais de uso diário do cliente, isolados por `client_id UUID`:
- `leads`, `lead_messages`, `lead_history` (Painel de Leads + CRM Kanban Inteligente)
- `planning_goals`, `planning_services`, `planning_tasks`, `planning_cycles` (Planejamento Semanal/Mensal)
- `assistants`, `api_connections` (Assistentes Virtuais e referências mascaradas de APIs)

## 3. Ponte segura App Web ↔ PostgreSQL (Próximo passo antes de produção total)
O navegador do cliente se conecta diretamente ao **Supabase** usando a chave pública (`anon key`) + sessão Google (**JWT**).
Como navegadores **não devem conectar diretamente no PostgreSQL** (isso exporia credenciais do banco), a integração em produção usará:
- Uma **API backend leve (Node.js/Express no Coolify)** que recebe o **JWT do Supabase** no cabeçalho `Authorization: Bearer ...`, valida o token, resolve o `client_id` do usuário autenticado e lê/grava com segurança no **PostgreSQL do Coolify**.

## Variáveis de Ambiente necessárias no Coolify (para API backend / n8n)
- `SUPABASE_URL=https://kunpzzmubfvzmweyxfjp.supabase.co`
- `SUPABASE_ANON_KEY=<preencher no painel do Coolify>`
- `SUPABASE_SERVICE_ROLE_KEY=<preencher no cofre/env privado da API e n8n, nunca no frontend>`
- `DATABASE_URL=<connection string interna do Postgres no Coolify>`
- `PORT=3000`
