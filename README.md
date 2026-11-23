# AtendeJá Profissional

Aplicação web do **AtendeJá** — landing page, checkout Pix (Mercado Pago / n8n), dashboard do contratante e painel administrativo. O frontend continua em HTML/CSS/JS; `server.js` adiciona a API Node.js para conectar os serviços com credenciais somente do servidor.

## O que está incluído

- **Landing Page + Onboarding por Nicho** (`index.html`, `styles.css`, `app.js`): apresentação dos planos, coleta do segmento, dados da empresa, e-mail Google, rede social e upload opcional da logo.
- **Checkout Pix** (`checkout.html`, `config.js`): geração de QR Code e Pix Copia e Cola via webhook n8n/Mercado Pago, com consulta automática de status (`status-pagamento`) para redirecionamento ao painel após aprovação.
- **PWA Instalável** (`manifest.webmanifest`, `sw.js`, `icon.svg`): aplicativo web instalável no celular e computador abrindo direto no painel do contratante (`dashboard.html`).
- **Dashboard do Contratante** (`dashboard.html`, `dashboard.css`, `dashboard.js`):
  - **Painel de Leads:** indicadores gerais, ticket médio, faturamento fechado, ranking de serviços vendidos, funil e histórico.
  - **CRM - Leads:** quadro Kanban com 6 etapas arrastáveis + motor de movimentação inteligente por conversa.
  - **Planejamento:** metas semanais/mensais, serviços a ofertar, agenda de segunda a domingo e métricas Previsto vs. Realizado.
  - **Meus Assistentes:** controle de 15 dias grátis (1 assistente inicial) com upgrade por plano (`Essencial`, `Pro`, `Empresa`).
  - **Conexões - APIs:** configuração mascarada de WhatsApp (WAHA/API), provedor de IA, webhooks e vínculo com assistentes.
  - **Meu Perfil:** edição completa dos dados da empresa e troca/remoção da logo.
- **Painel Admin do Fundador** (`admin.html`, `admin.js`): login Google via Supabase, visão de clientes/assinaturas/pagamentos/planos/auditoria e alteração de plano/status com motivo registrado.
- **API Node.js** (`server.js`): autentica tokens pelo Supabase Auth, registra o perfil básico do contratante com e-mail verificado, restringe operações administrativas, aplica limites de planos no backend e usa a role PostgreSQL `atendeja_app_runtime` com contexto RLS por transação.
- **Documentação** (`docs/especificacao-atendeja.md`): especificação visual e de UX do projeto.

## Como rodar localmente

O servidor Node serve as páginas e a API. Ele exige Node.js 20+ e variáveis de ambiente privadas para habilitar integrações:

```bash
npm install
npm start
```

Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `DATABASE_URL` no ambiente do servidor. A chave `secret` fica somente no servidor; a `publishable` pode ser exposta ao navegador. Não inclua a chave privada em arquivos do frontend ou no repositório. Para o painel do Fundador, configure também `FOUNDER_BOOTSTRAP_TOKEN` (remova-o após o primeiro vínculo); para acesso web de outra origem, defina `CORS_ORIGIN` com a lista exata de domínios.

O login Google exige que o provedor e as URLs de retorno sejam configurados no Supabase. A primeira conta Fundador usa o token de bootstrap configurado apenas no servidor.

Acesse `http://localhost:3000/index.html`, `http://localhost:3000/dashboard.html` ou `http://localhost:3000/admin.html`.

O botão Google do dashboard agora usa a sessão Supabase quando a API estiver configurada; o primeiro login cria/vincula o perfil básico e sincroniza o estado do app para um snapshot versionado no PostgreSQL. A configuração do provedor OAuth e URLs permitidas ainda é necessária. O backend também possui uma rota para eventos de pagamento assinados por HMAC, mas o workflow n8n ainda precisa ser ligado e validado em homologação para atualizar a assinatura automaticamente. Consulte [`db/README.md`](./db/README.md) para ordem de configuração, segurança e migração dos bancos.
