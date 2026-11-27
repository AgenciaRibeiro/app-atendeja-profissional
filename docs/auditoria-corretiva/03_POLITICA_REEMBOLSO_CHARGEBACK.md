# Política Operacional e Comercial de Reembolso, Cancelamento e Chargeback

- **Projeto:** AtendeJá Profissional
- **Versão:** 1.0 — Homologada para Avaliação do PO
- **Autoridade:** JR (Proprietário do Produto)
- **Data:** 2026-11-26
- **Status:** Proposta Formal de Política Comercial e Técnica

---

## 1. Princípios Gerais e Legislação Aplicável

Em conformidade com o Artigo 49 do Código de Defesa do Consumidor (CDC) da legislação brasileira e as melhores práticas de software como serviço (SaaS):

1. **Direito de Arrependimento (Garantia de 7 Dias):**
   - O contratante pode solicitar o cancelamento e reembolso integral do valor pago em até 7 (sete) dias corridos após a confirmação da assinatura, sem necessidade de justificativa.
2. **Reembolso 100% Integral:**
   - No período de 7 dias, a devolução é integral (100% do valor pago).
   - O estorno é realizado pelo mesmo meio de pagamento utilizado na compra (Pix via Mercado Pago).
3. **Cancelamento Após 7 Dias:**
   - Após o prazo de 7 dias, o contratante pode cancelar a renovação da assinatura a qualquer momento.
   - O cancelamento interrompe cobranças futuras e o acesso permanece disponível até o término dos 30 dias já pagos.
4. **Chargeback e Contestação Bancária:**
   - A abertura de contestação indevida ou chargeback junto ao banco/emissor suspende imediatamente o acesso da empresa à plataforma AtendeJá para prevenção de fraudes até a conclusão da análise.

---

## 2. Matriz de Estados de Pagamento e Assinatura

| Evento do Mercado Pago | Status do Pagamento (`subscriptions_payments`) | Status da Assinatura (`clients.subscription_status`) | Acesso ao Painel | Ação Automática no Sistema |
|:---|:---:|:---:|:---:|:---|
| **Aprovação Pix** | `approved` | `active` | **Liberado** | Ativa plano contratado e dispara WAHA com boas-vindas. |
| **Pix Pendente / Criado** | `pending` | `pending` (ou `trial` se em teste) | **Bloqueado** (exceto se em trial) | Aguarda pagamento do QR Code. |
| **Pix Expirado / Cancelado** | `cancelled` | Mantém anterior / `past_due` | **Bloqueado** | Não altera plano; registra expiração. |
| **Reembolso Concedido** | `refunded` | `suspended` | **Bloqueado (402)** | Desativa plano; registra auditoria de estorno. |
| **Chargeback / Contestação** | `charged_back` | `suspended` | **Bloqueado (402)** | Bloqueia acesso imediatamente; registra alerta em logs. |

---

## 3. Fluxo Operacional de Atendimento ao Cliente

1. **Canal Oficial de Solicitação:**
   - O cliente solicita reembolso através do WhatsApp de suporte (`5569993768304`) ou pelo e-mail oficial cadastrado.
2. **Conferência de Elegibilidade:**
   - A equipe verifica a data do pagamento no painel administrativo do AtendeJá (`/admin.html`) ou na view `vw_founder_clients_overview`.
   - Se dentro dos 7 dias corridos: aprovação imediata do reembolso pelo painel do Mercado Pago.
3. **Efeito no Banco de Dados (Automação):**
   - Ao estornar no Mercado Pago, o webhook notifica o backend com `status = 'refunded'`.
   - A RPC do Supabase atualiza a assinatura para `suspended` e bloqueia novas requisições com código `402 Assinatura sem acesso operacional`.
4. **Comunicação com o Cliente:**
   - Mensagem cordial informando a efetivação do estorno pelo banco emissor.

---

## 4. Trilha de Auditoria e Imutabilidade Financeira
- Nenhum registro de pagamento é excluído da tabela `subscriptions_payments` (histórico financeiro imutável).
- Todo estorno e alteração de status gera registro automático na tabela `admin_audit_logs` contendo data, valor, ator e motivo.
