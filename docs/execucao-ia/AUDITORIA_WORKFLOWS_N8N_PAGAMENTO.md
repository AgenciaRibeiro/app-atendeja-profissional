# Auditoria Técnica: Workflows n8n do Sistema de Pagamento AtendeJá

- **Data da Auditoria:** 2026-11-26
- **Ambiente:** Produção (n8n MCP - `https://n8n.minhaempresaautonoma.online`)
- **Pasta Auditada:** `86ccDQYrivxdtcXe` (AtendeJá)
- **Autoridade / PO:** JR
- **Auditor:** Antigravity AI Agent

---

## 1. Visão Geral e Conectividade MCP

A integração entre o Antigravity e o n8n via MCP (`mcp-server-api`) foi restabelecida e validada com sucesso. A inspeção direta identificou 3 workflows na pasta de pagamentos do AtendeJá (`86ccDQYrivxdtcXe`):

| ID | Nome do Workflow | Status | Gatilhos |
|---|---|---|---|
| `kawt70Q2DuuG0pMo` | AtendeJá — Mercado Pago (Pix + Cartão + Confirmação Automática + WAHA) | **ATIVO** | 2 Webhooks |
| `tmiMFW7MwRAZ7XK6` | My workflow (Consulta Status Pagamento) | **ATIVO** | 1 Webhook |
| `RN5fo9acYbGIVujC` | AtendeJá — Pix Direto na Chave + Confirmação 1-Clique (WAHA) | **INATIVO** | 0 |

---

## 2. Auditoria Detalhada do Workflow Principal (`kawt70Q2DuuG0pMo`)

Este workflow é o motor principal de criação e confirmação de pagamentos do AtendeJá.

### 2.1. Confirmação do Valor de Teste (R$ 1,00)
No nó `Validar Pedido` (Code Node), foi confirmada a configuração mencionada por JR:
```javascript
const PRECOS_OFICIAIS = {
  essencial: 1,
  pro: 1,
  empresa: 1
};
```
> **Nota de Governança:** O valor de R$ 1,00 foi validado como configuração deliberada de teste em produção por JR, não sendo tratado como erro de precificação. Os valores comerciais futuros homologados são: Essencial R$ 197/mês, Pro R$ 197/mês, Empresa R$ 397/mês.

---

### 2.2. Gaps e Vulnerabilidades Encontradas

#### 🔴 Gap Crítico 1: Desconexão com o Backend AtendeJá e Supabase
- **Fluxo Atual no n8n:**
  1. O Mercado Pago chama `POST /webhook/atendeja/webhook-pagamento`.
  2. O n8n consulta o Mercado Pago (`GET /v1/payments/{{ id }}`).
  3. Se `status === 'approved'`, o n8n executa imediatamente o nó `Ativar Cliente via WAHA` chamando `https://waha.minhaempresaautonoma.online/api/sendText`.
- **Problema:** O n8n **NÃO avisa o backend do AtendeJá** (`POST /api/webhooks/mercadopago`) e **NÃO chama o Supabase**.
- **Impacto:** O cliente recebe a mensagem de boas-vindas no WhatsApp informando que o pagamento foi aprovado, mas no banco de dados (`clients.subscription_status`) o cliente permanece inativo ou pendente, impossibilitando o login e acesso aos recursos do sistema.

#### 🟡 Gap 2: Método de Pagamento "Chumbado" como Pix
- No nó `Validar Pedido`:
  ```javascript
  const metodo = 'pix'; // HARDCODED
  ```
- **Problema:** Embora existam os nós `É Pix?` e `Criar Checkout Pro (Cartão)`, o código força `metodo = 'pix'` para todas as transações, ignorando qualquer escolha de cartão de crédito feita pelo usuário.

#### 🟡 Gap 3: Ausência de Validação de Assinatura (HMAC/x-signature)
- O webhook `atendeja/webhook-pagamento` aceita qualquer requisição HTTP pública sem checar o header `x-signature` do Mercado Pago ou um token compartilhado.

---

## 3. Auditoria do Workflow Secundário (`tmiMFW7MwRAZ7XK6`)

- **Função:** Endpoint de consulta sob demanda de status (`GET /webhook/atendeja/status-pagamento?paymentId=...`).
- **Comportamento:** Consulta a API do Mercado Pago usando a credencial `MERCADO PAGO - CHECKOUT` e retorna `{ ok: true, paymentId, status, approved }`.
- **Avaliação:** Funcional, porém sem tratamento defensivo quando o `paymentId` não é fornecido ou quando a API do Mercado Pago retorna 404.

---

## 4. Plano de Ação Recomendado (Para Execução Futura Autorizada)

1. **Sincronização com Supabase / Backend:**
   - Adicionar nó HTTP Request no workflow do n8n após aprovação para notificar `POST https://atendeja.minhaempresaautonoma.online/api/webhooks/mercadopago` ou chamar diretamente a RPC do Supabase (`process_payment_event`) com chave protegida.
2. **Desbloqueio de Cartão de Crédito:**
   - Ajustar o código para `const metodo = (body.metodo || 'pix').toLowerCase();`, permitindo o roteamento correto para o nó de Checkout Pro.
3. **Validação de Origem:**
   - Adicionar validação de segredo/token de webhook entre Mercado Pago e n8n.
