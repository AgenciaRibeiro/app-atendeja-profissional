# AtendeJá Profissional

Aplicação web estática e **PWA** (*Progressive Web App*) do **AtendeJá** — atendimento imediato no WhatsApp, checkout via Pix (Mercado Pago / n8n) e painel de gestão do contratante.

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
- **Documentação** (`docs/especificacao-atendeja.md`): especificação visual e de UX do projeto.

## Como rodar localmente

Por ser 100% estático (HTML/CSS/JS), basta servir a pasta com qualquer servidor HTTP local:

```bash
python3 -m http.server 8766
```

Ou com Node.js:

```bash
npx --yes serve -l 8766
```

Acesse `http://localhost:8766/index.html` ou `http://localhost:8766/dashboard.html`.
