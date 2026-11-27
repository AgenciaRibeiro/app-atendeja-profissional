# Pendências e bloqueios

## Bloqueios atuais
- Sem autorização para deploy ou alteração em produção, cobrança real, execução de workflow ativo, migração destrutiva ou alteração de credenciais.

## Pendências técnicas a revalidar
- Etapa 04 (concluída para avaliação de JR): Ajustes a autorizar no n8n (remover hardcode `metodo = 'pix'`, adicionar chamada HTTP assinada ao backend e corrigir link do WAHA).
- Refund/chargeback e idempotência (Etapa 05).
- Segredos, SSRF e logs (Etapa 06).
- Rate limiting e limites por plano (Etapa 07).
- WAHA, ativação e pausa humana (Etapa 08).
- Autenticação, sessão e painel admin (Etapa 09).
- Healthcheck/readiness e persistência (Etapa 10).
- Regressão e homologação integrada (Etapa 11).
- Documentação final e encerramento (Etapa 12).

## Fora do escopo / futuro
Registrar descobertas que não sejam necessárias à etapa ativa. Não iniciar implementação fora da etapa aprovada nesta missão.
