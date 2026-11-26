# Pendências e bloqueios

## Bloqueios atuais
- Confirmar ambiente de teste isolado e estado antes de testes com banco/integrações.
- Confirmar existência/validade de backup e último teste de restauração.
- Sem autorização para deploy ou alteração em produção, cobrança real, execução de workflow ativo, migração destrutiva ou alteração de credenciais.

## Pendências técnicas a revalidar
- Erro SQL próximo a undefined.
- Backup PostgreSQL e restauração.
- Pagamentos, atualização de assinatura e endpoint de status.
- Método Pix fixado no workflow e suporte efetivo a cartão.
- Refund/chargeback e idempotência.
- Segredos, SSRF e logs.
- Rate limiting e limites por plano.
- WAHA, ativação e pausa humana.
- Healthcheck/readiness e persistência.
- Divergências README, especificação, package.json e preços.

## Fora do escopo / futuro
Registrar descobertas que não sejam necessárias à etapa ativa. Não iniciar implementação nesta missão.
