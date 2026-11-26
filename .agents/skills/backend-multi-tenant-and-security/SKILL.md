---
name: backend-multi-tenant-and-security
description: Implementa arquitetura backend multi-tenant segura utilizando Supabase, PostgreSQL e Node.js, garantindo isolamento de dados, controle de acesso e proteção contra vazamento de informações entre empresas.
---

# BACKEND MULTI-TENANT & SEGURANÇA

## 1. OBJETIVO

Desenvolver e manter uma arquitetura backend multi-tenant segura, na qual diferentes empresas ou profissionais possam utilizar a mesma aplicação sem acessar informações uns dos outros.

Cada empresa deve possuir um ambiente lógico de dados independente, mesmo que compartilhe a mesma infraestrutura de banco de dados.

REGRA FUNDAMENTAL:

O profissional ou empresa A jamais poderá visualizar, consultar, modificar ou excluir dados pertencentes ao profissional ou empresa B, salvo quando existir uma autorização explícita, válida e controlada pelo sistema.

O isolamento deve ser garantido principalmente no backend e no banco de dados, nunca dependendo exclusivamente dos filtros da interface.

## 2. ARQUITETURA MULTI-TENANT

Utilizar arquitetura compartilhada com isolamento lógico por identificador de organização (tenant_id).

Cada registro pertencente a uma empresa deverá estar associado ao tenant correspondente.

Exemplos de entidades:

- Empresas.
- Usuários.
- Clientes.
- Leads.
- Contatos.
- Orçamentos.
- Serviços.
- Produtos.
- Conversas.
- Atendimentos.
- Tarefas.
- Oportunidades.
- Histórico de atividades.
- Arquivos e documentos.
- Configurações comerciais.

Sempre que uma entidade pertencer a uma empresa, deverá possuir uma referência explícita ao seu tenant.

Não confiar em identificadores enviados pelo frontend para determinar a empresa autorizada.

O tenant deve ser identificado a partir da sessão autenticada e das permissões verificadas no backend.

## 3. MODELAGEM DO BANCO DE DADOS

Utilizar PostgreSQL como banco de dados principal, com Supabase como plataforma de infraestrutura e serviços quando aplicável.

### Estrutura conceitual recomendada

**organizations**
- id
- name
- status
- created_at

**users**
- id
- name
- email
- status

**organization_members**
- id
- organization_id
- user_id
- role
- status
- created_at

**leads**
- id
- organization_id
- name
- phone
- email
- source
- status
- created_at

**customers**
- id
- organization_id
- name
- phone
- email
- created_at

**budgets**
- id
- organization_id
- customer_id
- total
- status
- created_at

A estrutura acima é uma referência arquitetural. Antes de implementar, inspecionar o banco existente e preservar tabelas, relacionamentos e convenções já estabelecidos.

### Integridade referencial

- Utilizar UUIDs quando adequado.
- Criar chaves estrangeiras.
- Garantir consistência entre organização e registros relacionados.
- Criar índices para organization_id.
- Evitar relacionamentos entre registros de empresas diferentes.
- Utilizar constraints para proteger a integridade dos dados.

Sempre que possível, utilizar chaves estrangeiras compostas para garantir que relacionamentos entre entidades respeitem o mesmo tenant.

Exemplo conceitual:

Um orçamento pertencente à empresa A não pode referenciar um cliente pertencente à empresa B.

## 4. ROW LEVEL SECURITY (RLS)

A segurança no PostgreSQL deve utilizar Row Level Security (RLS) para restringir o acesso aos registros conforme a organização autorizada.

Habilitar RLS em todas as tabelas que contenham dados privados ou específicos de uma empresa.

### Regras obrigatórias

- Usuários somente podem consultar registros de organizações às quais pertencem.
- Usuários somente podem inserir registros em organizações autorizadas.
- Usuários somente podem atualizar registros de organizações autorizadas.
- Usuários somente podem excluir registros de organizações autorizadas.
- Consultas sem autorização devem ser bloqueadas pelo banco.
- A ausência de uma política permissiva não pode resultar em acesso público.

Não confiar apenas em filtros como:

WHERE organization_id = '...'

A filtragem no código da aplicação não substitui a segurança implementada no banco.

### Exemplo conceitual de política RLS

```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members AS om
    WHERE om.organization_id = leads.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.status = 'active'
  )
);
```

Esse exemplo demonstra uma política de leitura. Não representa uma configuração completa de segurança.

Criar políticas específicas para SELECT, INSERT, UPDATE e DELETE, com validações adequadas em USING e WITH CHECK.

Revisar cuidadosamente permissões, funções auxiliares e possíveis recursões de políticas RLS.

## 5. AUTENTICAÇÃO E AUTORIZAÇÃO

Utilizar autenticação segura, preferencialmente por meio do Supabase Auth, quando compatível com a arquitetura existente.

Diferenciar claramente:

**Autenticação:**
Identifica quem está acessando o sistema.

**Autorização:**
Determina o que esse usuário pode fazer e quais dados pode acessar.

### Regras

- Validar a sessão em operações protegidas.
- Verificar a associação do usuário à organização.
- Validar se a associação está ativa.
- Aplicar controle de permissões por função.
- Não confiar em roles enviados pelo frontend.
- Não permitir alteração de privilégios pelo próprio usuário.
- Invalidar ou revogar acessos quando necessário.
- Implementar proteção contra tentativas de acesso indevido.

### Perfis de acesso

A arquitetura poderá contemplar:

- Proprietário.
- Administrador.
- Gerente.
- Supervisor.
- Atendente.
- Técnico.
- Usuário operacional.

Os perfis devem possuir permissões específicas e configuráveis.

A existência de uma função administrativa dentro de uma empresa não concede acesso automático aos dados de outras organizações.

## 6. SEGURANÇA NO NODE.JS

O backend Node.js deve funcionar como camada de validação, autorização e execução das regras de negócio.

Toda operação protegida deverá seguir este fluxo:

1. Receber a solicitação.
2. Validar a autenticação.
3. Identificar o usuário.
4. Identificar a organização autorizada.
5. Verificar a associação e as permissões.
6. Validar os dados recebidos.
7. Executar a operação dentro do escopo autorizado.
8. Registrar eventos relevantes.
9. Retornar somente informações permitidas.

### Regras de implementação

- Não confiar em organization_id recebido do navegador.
- Não aceitar user_id arbitrário como identidade autenticada.
- Não utilizar permissões exclusivamente controladas pelo frontend.
- Validar parâmetros e payloads.
- Utilizar consultas parametrizadas.
- Evitar SQL Injection.
- Tratar erros sem revelar informações internas.
- Aplicar rate limiting em endpoints sensíveis.
- Implementar controle de sessão.
- Validar permissões em cada operação protegida.

Toda consulta deverá respeitar o tenant autorizado, mesmo quando o usuário tentar manipular URLs, parâmetros, IDs ou requisições diretamente.

## 7. SUPABASE SERVICE ROLE E CREDENCIAIS

A chave SUPABASE_SERVICE_ROLE_KEY possui privilégios elevados e pode ignorar as políticas RLS.

Portanto:

- Nunca disponibilizar essa chave no frontend.
- Nunca armazená-la em variáveis públicas.
- Nunca incluí-la em arquivos versionados.
- Nunca registrá-la em logs.
- Restringir seu uso ao ambiente confiável do servidor.
- Evitar utilizá-la em operações comuns de usuários.
- Não presumir que operações executadas com essa chave estejam protegidas por RLS.

Quando uma operação administrativa precisar utilizar privilégios elevados, implementar verificações explícitas de autorização, tenant e finalidade da operação.

Preferir operações com contexto de usuário autenticado e RLS sempre que possível.

## 8. PROTEÇÃO CONTRA VAZAMENTO ENTRE TENANTS

Implementar proteção contra os seguintes cenários:

### IDOR (Insecure Direct Object Reference)

Ocorre quando um usuário altera o identificador de um registro para tentar acessar dados de outra empresa.

Exemplo:

Um usuário autorizado para consultar o lead 1001 tenta acessar o lead 2002, pertencente a outra organização.

O backend deve negar a operação.

### Manipulação de tenant_id

Um usuário altera o tenant_id no payload de uma requisição para inserir um registro em outra empresa.

O backend deve ignorar ou rejeitar a tentativa.

### Consultas sem escopo

Nenhuma consulta de dados privados poderá ser executada sem contexto de autorização e escopo de organização.

### Relacionamentos indevidos

Impedir que registros de uma organização referenciem registros pertencentes a outra.

### Exportações e relatórios

Aplicar as mesmas regras de isolamento em:

- Exportações CSV.
- Relatórios PDF.
- Dashboards.
- Consultas analíticas.
- Pesquisas globais.
- Downloads.
- APIs.
- Webhooks.
- Processamentos em segundo plano.

O isolamento precisa existir em todos os caminhos de acesso, não apenas nas telas principais.

## 9. ARQUIVOS E STORAGE

Quando utilizar Supabase Storage:

- Organizar arquivos por organização.
- Implementar políticas de acesso.
- Validar permissões antes de downloads.
- Não confiar apenas no caminho do arquivo.
- Utilizar URLs assinadas com validade limitada quando apropriado.
- Impedir que usuários descubram ou acessem arquivos de outras empresas.
- Validar tamanho, tipo e conteúdo dos arquivos enviados.

Exemplo de organização:

```text
organizations/
  {organization_id}/
    documents/
    budgets/
    customers/
    attachments/
```

A estrutura de pastas não substitui as políticas de autorização.

## 10. PROCESSAMENTO ASSÍNCRONO E INTEGRAÇÕES

Jobs, filas, webhooks e automações também devem respeitar o isolamento multi-tenant.

Regras:

- Cada tarefa deve carregar o tenant_id correspondente.
- Validar a origem e autorização do processamento.
- Não executar jobs com contexto de organização indefinido.
- Evitar misturar dados de diferentes empresas.
- Validar assinaturas de webhooks.
- Implementar idempotência.
- Registrar falhas e tentativas.
- Garantir isolamento em integrações com n8n e serviços externos.

Um processamento iniciado por uma empresa não poderá consultar ou modificar dados de outra empresa.

## 11. LOGS, AUDITORIA E MONITORAMENTO

Registrar eventos relevantes de segurança:

- Tentativas de acesso não autorizado.
- Falhas de autenticação.
- Alterações de permissões.
- Mudanças de associação entre usuários e organizações.
- Exclusões de registros.
- Operações administrativas.
- Falhas de validação de tenant.
- Acessos negados por políticas de segurança.

Os registros devem conter informações suficientes para auditoria, sem expor senhas, tokens ou dados sensíveis desnecessários.

Quando aplicável, manter:

- Identificador do usuário.
- Identificador da organização.
- Tipo de operação.
- Entidade afetada.
- Data e horário.
- Resultado.
- Origem da operação.

Proteger os logs contra alterações indevidas e restringir seu acesso.

## 12. TESTES DE ISOLAMENTO MULTI-TENANT

Criar testes automatizados utilizando pelo menos duas organizações independentes.

### Cenário de teste

**Empresa A**
- Usuário A.
- Lead A.
- Cliente A.
- Orçamento A.

**Empresa B**
- Usuário B.
- Lead B.
- Cliente B.
- Orçamento B.

### Testes obrigatórios

1. Usuário A consulta seus próprios leads.
2. Usuário A tenta consultar leads da empresa B.
3. Usuário A tenta atualizar um lead da empresa B.
4. Usuário A tenta excluir um lead da empresa B.
5. Usuário A tenta inserir um registro utilizando o tenant_id da empresa B.
6. Usuário A tenta acessar um orçamento da empresa B.
7. Usuário A tenta consultar um cliente da empresa B.
8. Usuário A tenta acessar arquivos da empresa B.
9. Usuário A tenta manipular IDs diretamente na API.
10. Usuário sem associação ativa tenta acessar dados.
11. Usuário administrador da empresa A tenta acessar a empresa B.
12. Consultas e relatórios tentam combinar dados de diferentes organizações.

### Resultado esperado

- A empresa A acessa somente os próprios dados.
- A empresa B acessa somente os próprios dados.
- Operações cruzadas são bloqueadas.
- Nenhuma informação privada é retornada indevidamente.
- As tentativas são registradas quando aplicável.

Executar os testes utilizando sessões e credenciais reais de usuários de teste, respeitando as políticas RLS.

Não utilizar apenas a chave administrativa nos testes, pois ela pode ignorar as políticas RLS e produzir resultados enganosos.

## 13. REGRAS DE IMPLEMENTAÇÃO E MANUTENÇÃO

Antes de modificar o banco ou backend:

1. Inspecionar a estrutura atual do projeto.
2. Identificar tabelas e relacionamentos existentes.
3. Mapear os pontos de entrada da API.
4. Identificar o sistema de autenticação.
5. Verificar as políticas RLS existentes.
6. Identificar operações que utilizam Service Role.
7. Mapear os pontos em que o tenant é identificado.
8. Elaborar um plano de correção ou implementação.

Durante a execução:

- Não apagar tabelas existentes sem autorização.
- Não remover políticas de segurança sem justificativa e aprovação.
- Não executar migrações destrutivas sem autorização.
- Criar backups antes de alterações críticas.
- Versionar migrações SQL.
- Aplicar alterações por etapas.
- Testar em ambiente isolado antes de produção.
- Documentar decisões arquiteturais.

## 14. CRITÉRIOS DE CONCLUSÃO

A implementação somente será considerada concluída quando:

- O isolamento entre organizações estiver implementado no banco.
- Todas as tabelas privadas estiverem protegidas por RLS quando aplicável.
- As operações do backend validarem identidade e autorização.
- As consultas respeitarem o tenant autorizado.
- Relacionamentos entre registros respeitarem a organização.
- Arquivos e documentos estiverem protegidos.
- Integrações e processos assíncronos respeitarem o tenant.
- Não houver exposição de credenciais privilegiadas.
- Os testes de acesso cruzado forem executados.
- Os testes negativos forem aprovados.
- Não houver regressões nas funcionalidades existentes.

Ao finalizar, apresentar relatório contendo:

1. Arquitetura multi-tenant implementada.
2. Tabelas protegidas.
3. Políticas RLS criadas ou revisadas.
4. Endpoints protegidos.
5. Operações administrativas identificadas.
6. Testes executados e respectivos resultados.
7. Vulnerabilidades encontradas e corrigidas.
8. Pendências de segurança.
9. Evidências da homologação.

## 15. DIRETRIZ FINAL

A segurança multi-tenant é um requisito estrutural e inegociável.

Não basta esconder os dados de outras empresas na interface.

O banco de dados, o backend, as APIs, os arquivos, os relatórios e os processos automatizados devem impedir efetivamente o acesso indevido entre organizações.

A regra central é:

**Cada empresa controla seus próprios dados, seus próprios usuários e suas próprias operações. Nenhum tenant pode ultrapassar seus limites de autorização.**

Priorizar sempre:

**Isolamento de dados → Autorização → Integridade → Auditoria → Desempenho.**
