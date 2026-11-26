# Fila sequencial da missão corretiva

Não reordenar sem justificativa documentada e decisão de JR.

| Ordem | Etapa | Status |
|---:|---|---|
| 00 | Revalidar baseline e preparar ambiente seguro | EM_ANDAMENTO |
| 01 | Integridade PostgreSQL e migrações | AGUARDANDO |
| 02 | Backup e recuperação | AGUARDANDO |
| 03 | Segurança multi-tenant e autorização | AGUARDANDO |
| 04 | Pagamentos Mercado Pago, backend e n8n | AGUARDANDO |
| 05 | Reembolso, chargeback e estados de assinatura | AGUARDANDO |
| 06 | Segredos, SSRF e hardening | AGUARDANDO |
| 07 | Limites por plano e rate limit | AGUARDANDO |
| 08 | WhatsApp/WAHA e automações | AGUARDANDO |
| 09 | Autenticação, sessão e painel admin | AGUARDANDO |
| 10 | Healthchecks, observabilidade e persistência | AGUARDANDO |
| 11 | Regressão e homologação integrada | AGUARDANDO |
| 12 | Documentação final e encerramento | AGUARDANDO |

Estados: AGUARDANDO, EM_ANDAMENTO, AGUARDANDO_JR, BLOQUEADA, CONCLUÍDA, DISPENSADA_POR_JR. Só avançar quando etapa anterior concluída ou formalmente dispensada. Não encerrar missão com etapa obrigatória pendente.
