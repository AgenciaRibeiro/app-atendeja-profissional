# Relatório de Auditoria e Especificação — Etapa 05: Reembolso, Chargeback e Estados de Assinatura

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 05 — Reembolso, Chargeback e Estados de Assinatura  
> **Data:** 2026-11-26 / 2026-11-27  
> **Status da Etapa 05:** CONCLUÍDA E VALIDADA  
> **Autoridade:** JR (Proprietário do Produto)  
> **Skills Aplicadas:** `backend-multi-tenant-and-security` e `security-and-hardening`  

---

## 1. Objetivo da Etapa 05

Mapear e auditar os estados de pagamento e ciclo de vida de assinaturas, assegurando que eventos de reembolso (*refund*), contestação bancária (*chargeback*) ou cancelamento sejam processados com idempotência, rastreabilidade e sem corrupção de dados entre o Mercado Pago, o backend Node.js e o Supabase.

---

## 2. Diagnóstico da Máquina de Estados

A auditoria da função RPC `process_payment_event` em `db/supabase_control_plane.sql` identificou uma **fragilidade crítica no tratamento de estornos**:

### 🔴 Falha Identificada na RPC `process_payment_event`
No código original do banco de dados (linhas 416-439):
1. **Bloqueio de Transição em `subscriptions_payments`:**
   ```sql
   status = CASE WHEN status = 'approved' AND p_status <> 'approved' THEN status ELSE p_status END
   ```
   *Efeito:* Se um pagamento foi marcado como `approved`, qualquer notificação posterior de `refunded` ou `charged_back` era ignorada pela cláusula CASE, mantendo o status gravado como `approved`.
2. **Ausência de Suspensão de Assinatura em `clients`:**
   O script só continha regra para ativação:
   ```sql
   IF p_status = 'approved' THEN
     UPDATE public.clients SET plan_code = p_plan_code, subscription_status = 'active' ...
   ```
   Não existia tratamento para `p_status IN ('refunded', 'charged_back')`.
3. **Consequência Prática:** Se um cliente solicitasse reembolso no Mercado Pago e o dinheiro fosse devolvido, a conta dele permanecia com `subscription_status = 'active'` e ele continuava utilizando o dashboard e os assistentes normalmente sem pagar.

---

## 3. Correção SQL Implementada e Aplicada

A função `public.process_payment_event` foi atualizada e aplicada no banco de dados Supabase e sincronizada no arquivo `db/supabase_control_plane.sql`:

```sql
  -- Atualiza o status do pagamento para o estado recebido
  UPDATE public.subscriptions_payments SET
    status = p_status,
    paid_at = COALESCE(p_paid_at, paid_at),
    amount_brl = p_amount_brl
  WHERE mp_payment_id = p_payment_id;
  ...
  IF p_status = 'approved' THEN
    UPDATE public.clients SET plan_code = p_plan_code, subscription_status = 'active', updated_at = NOW()
      WHERE id = v_client_id;
    IF v_created OR v_old_status IS DISTINCT FROM 'approved' THEN
      INSERT INTO public.admin_audit_logs(client_id, action, details)
      VALUES (v_client_id, 'payment_approved', pg_catalog.jsonb_build_object('payment_id', p_payment_id, 'plan_code', p_plan_code, 'amount_brl', p_amount_brl));
    END IF;
  ELSIF p_status IN ('refunded', 'charged_back') THEN
    UPDATE public.clients SET subscription_status = 'suspended', updated_at = NOW()
      WHERE id = v_client_id;
    INSERT INTO public.admin_audit_logs(client_id, action, details)
    VALUES (v_client_id, 'payment_' || p_status, pg_catalog.jsonb_build_object(
      'payment_id', p_payment_id,
      'plan_code', p_plan_code,
      'amount_brl', p_amount_brl,
      'previous_status', v_old_status
    ));
  END IF;
```

---

## 4. Evidência de Validação Prática em Produção

Executamos o teste sintético automatizado `scripts/test_refund_flow.js` via webhook com assinatura HMAC real:
- **Payment ID sintético:** `synth_refund_test_1795748669263`
- **E-mail sintético:** `synthetic.etapa05.1795748669263@atendeja.com.br`
- **Passo 1 (Approved):** HTTP 200 — cliente criado com status `active` e log de auditoria gravado.
- **Passo 2 (Refunded):** HTTP 200 — cliente atualizado para status `suspended`, pagamento para `refunded` e log de auditoria gravado.
- **Passo 3 (Idempotência):** HTTP 200 — reenvio do evento `refunded` aceito com idempotência perfeita sem duplicar nem quebrar o estado.
- **Comprovação no banco (SQL):**
  - `clients.subscription_status`: `suspended` (bloqueio 402 imediato em qualquer chamada de API de dados).
  - `subscriptions_payments.status`: `refunded`.
  - `admin_audit_logs`: registros imutáveis de `payment_approved` e `payment_refunded` auditados com sucesso.

---

## 5. Política Comercial e Legal Estabelecida

Elaboramos a política oficial em conformidade com o Código de Defesa do Consumidor (CDC, Art. 49):
- **Garantia Incondicional de 7 Dias:** Devolução de 100% do valor pago via Pix para solicitações em até 7 dias corridos.
- **Chargeback:** Suspensão imediata de acesso para averiguação antifraude.
- O documento completo está formalizado em:
  - [03_POLITICA_REEMBOLSO_CHARGEBACK.md](file:///c:/Users/Admin/Downloads/AGÊNCIA%202.7/PROJETOS%20DA%20AGÊNCIA/APP%20-%20ATENDEJA/docs/auditoria-corretiva/03_POLITICA_REEMBOLSO_CHARGEBACK.md)

---

## 6. Critérios de Aceite da Etapa 05

- [x] Máquina de estados de pagamentos e assinaturas mapeada.
- [x] Causa raiz da não-suspensão de contas estornadas corrigida no SQL do Supabase.
- [x] Correção da RPC `process_payment_event` testada e validada em produção com webhook real assinado.
- [x] Política comercial formal de reembolso e chargeback elaborada e homologada.
