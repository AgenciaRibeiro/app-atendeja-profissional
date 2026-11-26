# Protocolo de auditoria e fechamento

Após cada etapa:
1. Comparar solicitação/plano com diff e identificar alterações fora do escopo.
2. Verificar integridade, compatibilidade, migrações e reversibilidade.
3. Auditar autenticação, autorização, multi-tenant, segredos, validação e logs conforme Skills.
4. Executar testes pertinentes; registrar ambiente, comando/cenário e saída.
5. Verificar regressões nos fluxos adjacentes afetados.
6. Quando aplicável, verificar logs, healthchecks, persistência e backups.
7. Registrar commit, arquivos, evidências, limitações e itens não testados.
8. Decidir APROVADA, REPROVADA ou BLOQUEADA.

Só marcar CONCLUÍDA quando todos os critérios definidos antes da execução tiverem evidência. Se falhar, corrigir dentro da mesma etapa e auditar novamente. Container healthy isoladamente não comprova funcionalidade. Não omitir falhas.
