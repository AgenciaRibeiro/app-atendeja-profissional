---
trigger: always_on
---

# Regra Permanente: Backend Multi-Tenant e Segurança RLS

Sempre que a tarefa envolver criação, alteração ou consulta de tabelas no PostgreSQL/Supabase, endpoints de backend no Node.js/Next.js, regras de autenticação/autorização, manipulação de `tenant_id` ou `organization_id`, upload de arquivos no Storage, relatórios ou processamento assíncrono:

- **Ativação Obrigatória:** Aplique e consulte imediatamente a skill `backend-multi-tenant-and-security` (`.agents/skills/backend-multi-tenant-and-security/SKILL.md`).
- **Isolamento de Dados Inegociável:** A empresa A JAMAIS poderá visualizar, consultar, modificar ou excluir dados da empresa B. O isolamento deve existir no banco de dados e no backend, nunca dependendo exclusivamente de filtros de interface ou de `WHERE organization_id = '...'` manual.
- **Row Level Security (RLS) Mandatório:** Toda tabela com dados privados deve ter RLS habilitado com políticas restritivas para `SELECT`, `INSERT`, `UPDATE` e `DELETE` baseadas em `auth.uid()` e associação ativa em `organization_members`.
- **Prevenção de IDOR e Manipulação de Tenant:** Nunca confiar em `tenant_id` ou `user_id` enviados no payload ou URL pelo frontend. O tenant e as permissões devem ser resolvidos pela sessão autenticada no backend.
- **Proteção do Service Role:** A chave `SUPABASE_SERVICE_ROLE_KEY` é estritamente de uso interno do servidor. Nunca expor no frontend, variáveis públicas ou versionamento. Em testes e operações comuns, sempre usar contexto autenticado sob RLS.
- **Integridade Referencial Composta:** Garantir que relações entre tabelas (ex: orçamento e cliente) pertençam rigorosamente à mesma organização.
