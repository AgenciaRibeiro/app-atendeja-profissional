# Relatório de auditoria — linha de base preliminar

Projeto: AtendeJá Profissional. Repositório: AgenciaRibeiro/app-atendeja-profissional. Natureza: revisão estática e inspeção de infraestrutura/integração; não equivale a pentest, homologação integral ou certificação.

## Escopo observado
Código Node.js, frontend, PostgreSQL/Supabase, Docker/Coolify, checkout, integração Mercado Pago/n8n/WAHA, documentação e configurações operacionais.

## Achados preliminares a revalidar
1. **Preço/ambientes:** R$ 1,00 nos três planos é intencional para teste temporário. Não classificar como bug nem remover sem solicitação. Preços comerciais informados por JR: Essencial R$ 197,00; Pro R$ 197,00; Empresa R$ 397,00. Há documentação antiga com valores divergentes.
2. **Banco:** logs do PostgreSQL registraram erro de sintaxe próximo a `undefined` durante execução de `01_postgres_clientes.sql`. Impacto e estado atual não confirmados.
3. **Backups:** não havia backups agendados visíveis no Coolify no momento da inspeção. Revalidar e testar restauração isolada.
4. **Persistência:** app sem volume persistente cadastrado na inspeção. Avaliar arquivos JSON/configurações locais e risco em recriação.
5. **Pagamentos/n8n:** workflow `AtendeJá — Mercado Pago (Pix + Cartão + Confirmação Automática + WAHA)`, ID `kawt70Q2DuuG0pMo`, ativo. Inspeção apontou método fixado como Pix, possível lacuna na atualização do contratante e necessidade de confirmar endpoint de status e integração com webhook backend.
6. **Refund/chargeback:** suspeita de transições incompletas e possível ausência de suspensão/revogação de acesso. Revalidar SQL e regras comerciais.
7. **Webhook:** backend contém validação HMAC; confirmar integração fim a fim, assinatura sobre corpo bruto, idempotência e replay protection.
8. **Rate limit:** configuração possivelmente global/em memória; confirmar escopo por rota, plano, usuário e instância.
9. **Credenciais:** configurações de provedores podem estar em JSON local; avaliar proteção em repouso, permissões, persistência e logs.
10. **SSRF:** possível diferença de validação de URL no teste de conexão OpenCode; reproduzir apenas em ambiente isolado.
11. **Healthcheck:** pode verificar presença de configuração sem testar dependências reais; distinguir liveness e readiness.
12. **Testes:** package.json apresentava somente script start na linha de base. Mapear suíte real; badge de 95% no README não é evidência.
13. **Documentação:** README indica 2.0.0 e package.json 1.0.0; README/especificação contêm preços antigos.
14. **Fluxos demonstrativos:** respostas simuladas podem ser confundidas com integração real; determinar relevância para correção.
15. **Infraestrutura:** app e banco Running/Healthy na inspeção, o que não comprova fluxo funcional. Foram observados deploys anteriores falhados e reinício do DB; revalidar.

## Contexto operacional conhecido
- Coolify 4.7.6 na inspeção.
- Aplicação `app-atendeja-profissional`, domínios `https://atendeja.minhaempresaautonoma.online` e `https://www.atendeja.minhaempresaautonoma.online`.
- PostgreSQL `atendeja-postgres-clientes`, versão observada 18.7 Alpine.
- Workflow n8n ativo identificado acima; não foi executado.
- Nenhuma alteração, deploy, cobrança ou execução de workflow foi realizada na auditoria inicial.

## Limitações
Cada achado deve ser marcado ATUAL, RESOLVIDO, NÃO REPRODUZIDO ou PENDENTE DE EVIDÊNCIA após revalidação. Não inferir ausência de vulnerabilidade por scan indisponível ou sem resultados.
