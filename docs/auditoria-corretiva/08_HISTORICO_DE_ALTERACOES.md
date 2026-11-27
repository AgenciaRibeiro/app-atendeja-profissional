# Histórico de alterações da missão corretiva

| Data | Etapa | Alteração | Arquivos | Testes/auditoria | Commit |
|---|---|---|---|---|---|
| 2026-11-26 | Governança inicial | Criação do protocolo de autonomia e documentação-base; sem alteração de código funcional | AGENTS.md, .ai-governance/*, docs/auditoria-corretiva/*, docs/execucao-ia/* | Revisão documental na PR draft #1 | `e872ef4` |
| 2026-11-26 | Etapa 00 | Conclusão da linha de base, diagnóstico dos 15 achados, relatório inicial e regra de padrão de relatórios | AGENTS.md, .ai-governance/PROTOCOLO_DE_EXECUCAO.md, docs/execucao-ia/* | Testes estáticos `node --check`, hashes de produção e verificação Supabase API | Em andamento na branch |
| 2026-11-26 | Etapa 01 | Diagnóstico de integridade PostgreSQL, causa raiz de erro de sintaxe, auditoria de schemas Supabase e workflows n8n | docs/execucao-ia/RELATORIO_ETAPA_01_INTEGRIDADE_POSTGRESQL.md, docs/execucao-ia/AUDITORIA_WORKFLOWS_N8N_PAGAMENTO.md | Verificação remota de schemas via Supabase API e inspeção de workflows via n8n MCP | Em andamento na branch |
| 2026-11-26 | Etapa 02 | Criação dos scripts de backup/restore PostgreSQL com travas de segurança, backup JSON dos workflows n8n e POP de recuperação | scripts/backup/*, backups/n8n/*, docs/execucao-ia/RELATORIO_ETAPA_02_BACKUP_E_RECUPERACAO.md | Validação de scripts, teste de compressão gzip e extração de workflows | Em andamento na branch |
| 2026-11-26 | Etapa 03 | Auditoria completa de segurança multi-tenant, resolução anti-IDOR, RLS operacional e administrativo, atualização da matriz | docs/auditoria-corretiva/04_MATRIZ_SEGURANCA_MULTI_TENANT.md, docs/execucao-ia/RELATORIO_ETAPA_03_SEGURANCA_MULTI_TENANT.md | Análise estática de escopo em `server.js` e validação da matriz de 11 regras multi-tenant | Em andamento na branch |
| 2026-11-26 | Etapa 04 | Remoção de cartão, correção de link do WAHA e integração completa de webhook n8n → AtendeJá com HMAC | n8n workflow `kawt70Q2DuuG0pMo`, docs/execucao-ia/RELATORIO_ETAPA_04_PAGAMENTOS_MERCADOPAGO_N8N.md, scripts/test_webhook_hmac.js | Teste de integração HTTP 200 no endpoint de webhook em produção e publicação no n8n | Em andamento na branch |

Adicionar uma linha por conjunto coeso. Não apagar histórico; registrar reversões.
