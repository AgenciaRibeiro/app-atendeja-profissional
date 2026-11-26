# Matriz de segurança multi-tenant

Status inicial: requisitos a testar. Registrar resultado e evidência em cada etapa.

| Área | Verificação | Evidência de aceite |
|---|---|---|
| Identidade | usuário derivado de sessão validada | testes sessão válida/inválida |
| Tenant | tenant resolvido no servidor | manipulação de tenant_id negada |
| RLS | SELECT/INSERT/UPDATE/DELETE em tabelas privadas | SQL + testes A/B |
| Relações | referências pertencem ao mesmo tenant | testes de vínculo cruzado |
| Admin | rotas exigem papel/claim adequado | chamadas sem/com papel |
| RPC | funções validam ator, tenant e permissões | testes positivos/negativos |
| Arquivos | Storage/download isolado | acesso cruzado negado |
| Logs | sem tokens/segredos/dados excessivos | inspeção sanitizada |
| Rate limit | escopo por IP/usuário/rota/instância | testes de concorrência/fronteira |
| Webhooks | autenticidade, idempotência e replay protection | eventos falsos/duplicados/expirados |

Casos mínimos: tenant A não lê, altera, exclui ou infere dados de B; IDs manipulados não concedem acesso; admin exige autorização; sem sessão não há acesso privado; erros não revelam dados de outros tenants.

Para cada caso registrar ID, pré-condição, dados sintéticos, esperado, observado, evidência e status. Não usar dados reais.
