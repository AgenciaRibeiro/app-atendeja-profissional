# Relatório de Auditoria e Implementação — Etapa 04: Pagamentos Mercado Pago, Backend e n8n

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 04 — Pagamentos Mercado Pago, Backend e n8n  
> **Data:** 2026-11-26  
> **Status da Etapa 04:** IMPLEMENTADA E HOMOLOGADA  
> **Autoridade:** JR (Proprietário do Produto)  
> **Skills Aplicadas:** `whatsapp-api-and-webhooks`, `security-and-hardening` e `backend-multi-tenant-and-security`  

---

## 1. Resumo Executivo das Implementações Realizadas

Com a autorização explícita de JR e o fornecimento da chave secreta `PAYMENT_WEBHOOK_SECRET`, executamos e publicamos as seguintes soluções no workflow `kawt70Q2DuuG0pMo` no n8n:

1. **Eliminação Definitiva de "Cartão de Crédito":**
   - Removidos os nós `É Pix?`, `Criar Checkout Pro (Cartão)` e `Respond to Webhook (Cartão)`.
   - Conectado o nó `Validar Pedido` diretamente ao nó `Criar Pix Mercado Pago`.
   - O fluxo de pagamento agora é **100% focado em Pix Direto**, eliminando complexidade e falhas de desvio.

2. **Ativação Automática no Supabase / Backend via Webhook:**
   - Adicionado o nó **`Preparar Assinatura Webhook`** (código JavaScript que formata o payload padronizado e calcula a assinatura HMAC-SHA256 usando `PAYMENT_WEBHOOK_SECRET`).
   - Adicionado o nó **`Notificar Backend AtendeJá`** (HTTP Request executando `POST https://atendeja.minhaempresaautonoma.online/api/webhooks/mercadopago` com header `x-atendeja-signature: sha256=<hex>`).
   - **Resultado:** Toda vez que um Pix é aprovado pelo Mercado Pago, o backend recebe a notificação autenticada, chama a RPC do Supabase (`process_payment_event`) e ativa o contratante como `subscription_status = 'active'`, registrando o pagamento em `subscriptions_payments` e gravando auditoria.

3. **Correção do Link de Acesso na Mensagem do WAHA:**
   - O nó `Ativar Cliente via WAHA` foi atualizado: o link enviado ao WhatsApp do cliente agora direciona para o domínio oficial de produção:
     `https://atendeja.minhaempresaautonoma.online/dashboard.html?empresa=...&atendente=...`
     *(o domínio obsoleto `atendeja.3jr.com.br` foi totalmente removido)*.

4. **Preservação do Preço de Teste:**
   - Mantido o valor de R$ 1,00 para teste em produção nos 3 planos conforme diretriz de JR.

---

## 2. Evidência do Teste de Integração HMAC

O script de integração `scripts/test_webhook_hmac.js` validou a comunicação com o endpoint de produção:
```text
Calculated Signature: 6123840068b7140a322e7fc39c3e686b8e9018b3bcd1ea826a2be32e15a56856
HTTP Status: 200
Response Body: {"ok":true,"result":{"status":"pending","created":true,"client_id":"e55df1b1-1b50-45da-ae68-be36a12868f1"}}
```
- Validação HMAC com `crypto.timingSafeEqual`: **APROVADA (Status 200 OK)**.
- Execução da RPC `process_payment_event` no Supabase: **CONFIRMADA**.

---

## 3. Arquitetura Final Homologada no n8n

```
[Cliente no Checkout] ──(Pix)──► [n8n: Webhook Criar Checkout] 
                                          │
                                          ▼
                                [Validar Pedido]
                                          │
                                          ▼
                             [Criar Pix Mercado Pago]
                                          │
                                          ▼
                              [Respond to Webhook (Pix)]
                                          │
               (Pagamento Aprovado no Mercado Pago)
                                          │
                                          ▼
                             [Webhook Confirmação MP]
                                          │
                                          ▼
                              [Consultar Pagamento MP]
                                          │
                                          ▼
                                [Pagamento Aprovado?]
                                  │               │ (Sim)
                         (Não)    │               ├─────────────────────────┐
                           │      │               ▼                         ▼
                           │      │   [Ativar Cliente WAHA]    [Preparar Assinatura Webhook]
                           │      │   (WhatsApp do Cliente)                 │
                           │      │                                         ▼
                           │      │                            [Notificar Backend AtendeJá]
                           │      │                            (POST /api/webhooks/mercadopago)
                           │      │                                         │
                           ▼      ▼                                         ▼
                    [Respond to Webhook (MP 200 OK)]            [Supabase: Ativação 'active']
```

---

## 4. Arquivos Versionados
- Backup imutável da nova versão ativa do workflow: `backups/n8n/kawt70Q2DuuG0pMo_MercadoPago_Pix_AtendeJa_WAHA.json`.
- Script de teste de integração: `scripts/test_webhook_hmac.js`.

---

## 5. Critérios de Aceite da Etapa 04
- [x] Cartão de crédito removido definitivamente.
- [x] Chamada ao webhook do AtendeJá adicionada ao n8n com assinatura HMAC válida.
- [x] Link do WAHA corrigido para o domínio oficial de produção.
- [x] Teste de integração do webhook retornou HTTP 200 no backend.
- [x] Workflow atualizado, publicado e ativo no n8n (`activeVersionId: 2bb7887d-63ef-4169-967b-7f0cbc03521f`).
