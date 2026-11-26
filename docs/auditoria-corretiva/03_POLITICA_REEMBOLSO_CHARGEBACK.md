# Política operacional de reembolso e chargeback — definição pendente

**Status: RASCUNHO TÉCNICO. Não publicar nem tratar como termos comerciais aprovados.**

## Objetivo
Definir tratamento operacional de solicitações de reembolso, cancelamentos, contestações e chargebacks, com rastreabilidade entre Mercado Pago, banco, assinatura e acesso.

## Princípios
- Não prometer prazo, elegibilidade, valor ou condição sem validação dos termos comerciais e legislação aplicável.
- Distinguir solicitação, reembolso aprovado/concluído, parcial, chargeback aberto, ganho/perdido e análise.
- Preservar IDs do provedor e internos, valores, moeda, timestamps, motivo/código e evidências.
- Processar eventos com idempotência e tolerância a duplicidade/ordem de chegada.
- Não alterar pagamento/assinatura manualmente sem ator, motivo e evidência.
- Nunca apagar histórico financeiro.

## Fluxo proposto
1. Receber evento/solicitação e identificar pagamento/contratante.
2. Validar origem e autenticidade.
3. Consultar estado no provedor quando necessário.
4. Registrar evento seguro e normalizar estado.
5. Aplicar regra de acesso somente após regra comercial aprovada.
6. Registrar auditoria e notificar responsável conforme canal aprovado.
7. Conciliar estado interno e provedor.

## Estados técnicos candidatos
Pagamento: `pending`, `approved`, `rejected`, `cancelled`, `expired`, `refunded`, `partially_refunded`, `charged_back`, `under_review`.
Assinatura: `pending_payment`, `trialing`, `active`, `past_due`, `suspended`, `cancelled`, `expired`, `under_review`.
São propostas; mapear estados oficiais do Mercado Pago e modelo atual antes de implementar.

## Decisões comerciais que JR deve aprovar
Elegibilidade e canais; prazos; cálculo proporcional/taxas; efeito sobre acesso/assinatura; chargeback aberto/ganho/perdido; cancelamento/renovação; texto de comunicação e responsável.

## Auditoria
Guardar referência, valor, status anterior/novo, origem, idempotency key, decisão, ator/sistema, timestamps e conciliação. Não guardar dados de cartão ou segredos.

Este documento não autoriza reembolsar, cancelar assinaturas nem publicar política.
