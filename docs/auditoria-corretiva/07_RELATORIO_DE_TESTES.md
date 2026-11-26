# Relatório de testes — registro incremental

Registrar somente testes executados, com ambiente, commit, dados sintéticos, comando/cenário, resultado e evidência. Status: PASSOU, FALHOU, BLOQUEADO ou NÃO EXECUTADO. Não inferir cobertura por badge. Não usar cobrança, mensagem ou alteração de produção como teste.

| Domínio | Cenários | Status inicial |
|---|---|---|
| Banco/migrações | DB isolado, idempotência, constraints | PENDENTE |
| Backup | restauração isolada | PENDENTE |
| Multi-tenant | isolamento A/B e IDOR | PENDENTE |
| Pagamentos | Pix/cartão sandbox, webhook, idempotência | PENDENTE |
| Refund/chargeback | transições e ordem de eventos | PENDENTE |
| Segredos/SSRF | exposição e URLs privadas | PENDENTE |
| Planos/rate limit | limites e fronteiras | PENDENTE |
| WhatsApp | ativação simulada, duplicidade, pausa humana | PENDENTE |
| Auth/admin | login, sessão, autorização | PENDENTE |
| Health/readiness | dependências e persistência | PENDENTE |
| Regressão | fluxos existentes | PENDENTE |

Adicionar registros sem apagar execuções anteriores.
