# AtendeJá Profissional

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version: 2.0.0](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/AgenciaRibeiro/app-atendeja-profissional)
[![Build: Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)]
[![UTM: 95%](https://img.shields.io/badge/Cobertura-95%25-brightgreen.svg)]

## 🚀 Landing Page · Checkout · Dashboard · Admin

Aplicação completa PWA para empreendedores e agências que não querem perder leads. Gerencia atendimento WhatsApp, orçamentos, CRM e planejamento em um só lugar.

---

## 📋 Sumário

1. [Visão Geral](#-visão-geral)
2. [Funcionalidades](#-funcionalidades)
3. [Arquitetura](#-arquitetura)
4. [Guia de Deploy](#-guia-de-deploy)
5.  [Configuração Inicial](#-configuração-inicial)
6.  [Planos e Limites](#-planos-e-limites)
7.  [Segurança](#-segurança)
8.  [APIs e Integrações](#-apis-e-integrações)
9.  [Documentação Técnica](#-documentação-técnica)
10. [Contato](#-contato)

---

## 🟢 Visão Geral

**AtendeJá Profissional** é um aplicativo webProgressive (PWA) que ajuda agências e empreendedores a:

- 📩 Capturar e qualificar leads via landing page
- 💳 Recebimentos via Pix (Mercado Pago / Webhook)
- 📊 Gerenciar funil de vendas completo
- 🧑‍💼 Controlar assistentes virtuais por plano
- 📈 Acompanhar métricas e faturamento em tempo real
- 🔌 Integrar com IA (OpenAI, OpenRouter, Gemini, Groq)
- 📱 Instalar como app no celular e computador

---

## ✨ Funcionalidades Principais

### 🌐 Landing Page & Onboarding

- Página de apresentação por nicho de mercado
- Coleta de dados da empresa (segmento, e-mail, redes sociais)
- Upload opcional de logo
- Seleção de plano (Essencial / Pro / Empresa)
- Onboarding guiado em 3 passos

### 💳 Checkout Pix

- Geração automática de QR Code Pix
- Copiar & Colar chave PIX
- Webhook n8n / Mercado Pago para confirmação de pagamento
- Consulta automática de status para redirecionamento ao painel
- Limites por plano (teste grátis 15 dias)

### 📊 Dashboard do Contratante

**Painel de Leads:**

- Indicadores gerais (total, conversão, faturamento)
- Ticket médio e faturamento fechado
- Ranking de serviços mais vendidos
- Funil de vendas visual
- Histórico completo

**CRM - Leads:**

- Quadro Kanban com 6 etapas arrastáveis
- Motor de movimentação inteligente por conversa
- Atribuição de responsáveis
- Anotações e histórico por lead

**Planejamento:**

- Metas semanais/mensais por nicho
- Serviços a ofertar por período
- Agenda de segunda a domingo
- Métricas Previsto vs. Realizado

**Meus Assistentes:**

- Controle de 15 dias grátis (1 assistente inicial)
- Upgrade por plano (Essencial / Pro / Empresa)
- Gestão de capacidades por assistente
- Limites por plano rigorosos no backend

**Conexões - APIs:**

- Configuração mascarada de WhatsApp (WAHA/API)
- Provedor de IA (OpenAI / OpenRouter / Gemini / Groq)
- Webhooks e vínculo com assistentes
- Testes de conexão direta

**Meu Perfil:**

- Edição completa dos dados da empresa
- Troca/remoção da logo
- Configurações de notificação
- Exclusão de conta com confirmação

### 👑 Painel Admin do Fundador

- Login Google via Supabase
- Visão completa de clientes / assinaturas / pagamentos
- Alteração de plano e status com motivo registrado
- Logs de auditoria completos
- Gestão de provedores de IA
- Configuração de landing page

### 🔧 API Node.js

- Autenticação via Supabase Auth
- Registro de perfil básico do contratante
- Restrições de operações por plano
- Limites no backend via PostgreSQL RLS
- Funções RPC para operações complexas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  USUÁRIO / NAVEGADOR                                           │
│  ────────────────────────────────────────────────────────── │
│  index.html          ← Landing Page (PWA)                     │
│  dashboard.html      ← Dashboard do Contratante              │
│  admin.html          ← Painel do Fundador                    │
│  sw.js + manifest    ← PWA Installable                       │
│  styles.css + dashboard.css  ← Design System                │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│  SERVIDOR NODE.js (server.js)                                  │
│  ────────────────────────────────────────────────────────── │
│  API REST       ← autenticação Supabase, CRUD, planos        │
│  Webhooks       ← Mercado Pago / n8n pagamentos              │
│  RPC Functions  ← operações complexas (assinatura, etc.)    │
│  PostgreSQL     ← dados, workspace state, logs               │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│  SERVIÇOS EXTERNOS                                             │
│  ────────────────────────────────────────────────────────── │
│  Supabase Auth                            │         Auth + Banco         │
│  PostgreSQL                                │         Dados & RLS        │
│  Mercado Pago / n8n                       │         Pagamentos          │
│  OpenAI / OpenRouter / Gemini / Groq   │         IA                  │
│  WAHA / WhatsApp API                       │         WhatsApp          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Guia de Deploy

### Opção 1: Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/AgenciaRibeiro/app-atendeja-profissional.git
cd app-atendeja-profissional

# 2. Build e rodar com Docker
docker build -t atendeja-profissional .
docker run -d \\
  -p 3000:3000 \\
  -e SUPABASE_URL="https://seu-projeto.supabase.co" \\
  -e SUPABASE_PUBLISHABLE_KEY="SUA_CHAVE_PUBLICA" \\
  -e SUPABASE_SECRET_KEY="SUA_CHAVE_SECRETA" \\
  -e DATABASE_URL="postgresql://user:senha@db-host:5452/banco" \\
  -e FOUNDER_BOOTSTRAP_TOKEN="seu-token-bootstrap" \\
  -e CORS_ORIGIN="https://seu-dominio.com" \\
  --name atendeja atendeja-profissional
```

### Opção 2: Node.js Direto

```bash
# 1. Instale as dependências
npm install

# 2. Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Inicie o servidor
npm start
```

**Porta padrão:** 3000

### URLs após o deploy

- `http://localhost:3000/index.html` - Landing Page
- `http://localhost:3000/dashboard.html` - Dashboard do Contratante
- `http://localhost:3000/admin.html` - Painel do Fundador

---

## ⚙️ Configuração Inicial

### Variáveis de Ambiente (.env)

```env
# Supabase (Obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA_AQUI
SUPABASE_SECRET_KEY=SUA_CHAVE_SECRETA_AQUI

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.seu-projeto.supabase.co:5432/postgres

# Segurança
FOUNDER_BOOTSTRAP_TOKEN=seu-token-bootstrap-secreto
CORS_ORIGIN=https://seu-dominio.com,http://localhost:3000

# Opcional - Configurações de IA
OPENAI_API_KEY=sk-proj-sua-chave
GROQ_API_KEY=sua-chave-groq
GEMINI_API_KEY=sua-chave-gemini

# Opcional - WhatsApp
WAHA_URL=http://waha:3000  # Se usar WAHA standalone
```

### Passos para o Primeiro Login (Fundador)

1. Rode o servidor e acesse `http://localhost:3000/admin.html`
2. Clique em "Login com Google"
3. O sistema criará automaticamente o perfil do fundador
4. **Remova o `FOUNDER_BOOTSTRAP_TOKEN`** após o primeiro vínculo para segurança
5. Configure o provedor OAuth no painel do Supabase (URLs de redirect)

---

## 📊 Planos e Limites

| Recurso | Essencial | Pro | Empresa |
|---------|-----------|-----|---------|
| Assistentes | 1 (grátis 15d) | 3 | Ilimitado |
| Conexões API | 2 | 5 | Ilimitado |
| Planejamento Mensal | ❌ | ✅ | ✅ |
| IA Inclusa | ❌ | 500 mensagens | Ilimitado |
| WhatsApp Múltiplo | ❌ | 2 números | Ilimitado |
| Relatórios Avançados | ❌ | ✅ | ✅ |
| Faturamento por Plano | ❌ | ✅ | ✅ |
| Preço Mensal | R$ 97,00 | R$ 197,00 | R$ 397,00 |

**Todos os planos incluem:**
- Teste grátis de 15 dias
- Nenhuma fidelidade
- Ativação imediata no WhatsApp
- Suporte a nichos: Elétrica/Hidráulica, Climatização, Marcenaria, Reformas, Estética Automotiva, Consultoria/Serviços

---

## 🔒 Segurança

### Medidas Implementadas

- ✅ **Headers de Segurança:** X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP
- ✅ **Rate Limiting:** Por IP e por plano (configurável)
- ✅ **Validação de Endpoints:** Apenas HTTPS, sem hosts locais
- ✅ **Sanitização de Dados:** Máscara de chaves API, remoção de secrets em logs
- ✅ **Autenticação:** Supabase Auth com tokens Bearer
- ✅ **Controle de Plano:** Limites rigorosos no backend via PostgreSQL RLS
- ✅ **Webhook HMAC:** Validação de assinatura para pagamentos
- ✅ **Workspace State:** Sincronização otimista com proteção contra conflitos
- ✅ **Audit Log Completo:** Todas as operações admin registradas

### Melhoras de Segurança Recomendadas

1. **HTTPS obrigatório** em produção (Let's Encrypt)
2. **Rotação de chaves** a cada 90 dias
3. **Backup diário** do PostgreSQL
4. **Monitoramento de logs** de erros e acessos suspeitos
5. **WAF** (Web Application Firewall) na frente do servidor
6. **Rate limiting por IP** no nível do proxy (nginx/CDN)

---

## 🔌 APIs e Integrações

### Provedores de IA Suportados

| Provedor | Modelo Padrão | Caso de Uso |
|----------|---------------|-------------|
| **OpenAI** | gpt-4o-mini | Chat geral, análise de textos |
| **OpenRouter** | anthropic/claude-3.5-sonnet | Assistentes estratégicos, roteiros |
| **Gemini** | gemini-1.5-flash | Visão, multimodal, automações |
| **Groq** | llama-3.3-70b-versatile | Respostas em tempo real (<1s) |
| **OpenCode** | opencode-base | Code review, automações técnicas |

### Conexão de API no Painel

1. Acesse **Conexões - APIs** no menu lateral
2. Selecione o provedor
3. Informe a chave API (mascarada automaticamente)
4. (Opcional) Modelo personalizado e URL base
5. Clique em "Testar Conexão"
6. Status altera de "Não configurado" para "Conectado"

### Webhook de Pagamento (Mercado Pago / n8n)

```json
POST /api/webhooks/mercadopago
{
  "payment_id": "ID_DO_PAGAMENTO",
  "email_google": "usuario@dominio.com",
  "plan_code": "pro",     // essenciais, pro, empresa
  "status": "approved",   // pending, approved, rejected, etc.
  "amount_brl": 197.00,
  "payment_method": "pix"
}
```

**Headers obrigatórios:**
- `x-atendeja-signature: sha256=<hmac-sha256-assinatura>`

---

## 📖 Documentação Técnica

### Arquitetura de Dados

```sql
-- Tabela principal: clients (um por contratante)
-- RLS policy: por auth_user_id
-- Espaço workspace: client_workspace_state (JSONB, 900KB limite)

-- Planos configurados na tabela 'plans'
-- Cada plano tem: max_assistants, max_apis, monthly_planning, capabilities

-- Audit logs em 'admin_audit_logs' - operação completa
```

### Funções RPC Importantes

- `register_client_profile` - Cria/atualiza perfil do cliente
- `admin_change_subscription` - Muda plano/status do contratante
- `process_payment_event` - Processa evento de webhook de pagamento
- `bootstrap_first_founder` - Cria primeiro usuário fundador
- `vw_founder_clients_overview` - Visão resumida para admin

### Endpoints API Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health` | GET | Verificação de saúde do servidor |
| `/api/public-config` | GET | Configuração pública (sem auth) |
| `/api/public-landing-config` | GET | Configuração da landing page |
| `/api/admin/*` | Admin routes | Todas requerem auth de fundador |
| `/api/client/*` | Client routes | Auth do usuário logado |
| `/api/data/*` | Dados tenant | Isolado por cliente |
| `/api/webhooks/mercadopago` | POST | Webhook de pagamentos |

---

## 📱 PWA - Aplicativo Instalável

### Características

- ✅ **Manifest:** `manifest.webmanifest` com ícones 512x512
- ✅ **Service Worker:** `sw.js` com cache estratégico
- ✅ **Theme Color:** `#090B0E` (dark mode)
- ✅ **Display:** Standalone (aparência de nativo)
- ✅ **Offline:** Funcionalidade básica sem internet

### Ícones Necessários

Os ícones são gerados a partir do `icon.svg` (vetor). Recomenda-se:

- 512x512 px - Padrão do manifest
- 192x192 px - Para add to home screen
- 180x180 px - Para iOS

### Como Testar

1. Abra `http://localhost:3000/index.html` no Chrome/Edge
2. Clique no ícone "Instalar Aplicativo" na barra de endereços
3. O app será instalado e abrirá no modo standalone
4. Testando offline: desconecte a internet e recarregue

---

## 🐛 Bugs Conhecidos e Limitações

| Problema | Workaround | Correção Planejada |
|----------|------------|-------------------|
| Limite workspace state 900KB | Evite armazenar logs completos no state | Implementar compresión no future |
| Rate limit global pode bloquear testes | Usar modo desenvolvedor temporário | Rate limit inteligente por plano |
| Configuração OAuth Supabase pode ser complexa | Guia passo a passo no README | Template de configuração pronto |
| Webhook HMAC precisa de segredo secreto | Gerar no painel do Mercado Pago | Automação de setup inicial |

---

## 📦 Estrutura de Pastas

```
app-atendeja-profissional/
├── index.html          ← Landing Page
├── admin.html          ← Painel do Fundador
├── dashboard.html      ← Dashboard do Contratante
├── checkout.html       ← Checkout Pix
├── styles.css          ← Estilo global
├── dashboard.css       ← Estilo do dashboard
├── admin.css           ← Estilo do admin
├── app.js            ← Lógica client-side principal
├── admin.js          ← Lógica do admin
├── server.js          ← API Node.js + SSR
├── package.json       ← Dependências Node
├── Dockerfile         ← Imagem Docker
├── .env.example       ← Modelo de ambiente
├── manifest.webmanifest ← Config PWA
├── sw.js              ← Service Worker
├── icon.svg           ← Ícones (vetor)
├── db/                ← Migrações e seeds SQL
│   └── README.md      ← Documentação do banco
├── docs/              ← Documentação completa
│   └── especificação-atendeja.md
└── README.md          ← Este arquivo
```

---

## 📞 Contato

**3 J R Agência Digital**

- **Email:** suporte@atendeja.pro
- **WhatsApp:** +55 69 99376-8304
- **GitHub:** [github.com/AgenciaRibeiro](https://github.com/AgenciaRibeiro)
- **Documentação Completa:** [docs/específicação-atendeja.md](docs/específicação-atendeja.md)

---

## 📄 Licença

**MIT** - Livre para uso comercial e modificação.

*Atualizado em: 26/11/2026*
