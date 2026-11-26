# Regras e Diretrizes do Projeto AtendeJá

## Ativação Automática de Skills

### 1. Frontend & Design: Skill `frontend-ui-engineering`
Sempre que qualquer solicitação do usuário envolver interface de usuário (UI), experiência do usuário (UX), design, layout, responsividade para celular/desktop, criação ou edição de páginas, seções (hero, cards, carrosséis, depoimentos, formulários, botões ou modais):

- **Ativação Obrigatória da Skill `frontend-ui-engineering`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `frontend-ui-engineering`** (`.agents/skills/frontend-ui-engineering/SKILL.md`).
  - Não espere o usuário pedir "frontend", "design" ou "use a skill". A ativação deve ser **100% autônoma e imediata**.
- **Diretrizes Mandatórias de Qualidade Visual:**
  - **Padrão Agência (Anti-Template):** Nada de visual genérico ou empilhamento cru de blocos. Todo design deve parecer desenhado por uma agência sênior de alto nível.
  - **Mobile-First Real:** O celular é o dispositivo primário do cliente. Zero rolagem horizontal indesejada em 360px, 390px e 430px.
  - **Áreas de Toque:** Botões e alvos de toque interativos com no mínimo 44×44px (WCAG).
  - **Altura e Espaçamentos Seguros:** Usar `min-h-dvh` para telas cheias e respeitar `env(safe-area-inset-bottom)` em barras ou botões fixos.
  - **Carrosséis Fluidos:** Sempre mostrar uma prévia do próximo slide no celular (ex: 85% a 90% da largura) para indicar que desliza, com suporte ao toque e desaceleração suave.
  - **Contraste e Acessibilidade:** Textos legíveis com contraste mínimo de 4.5:1 e rótulos em português.

---

### 2. Segurança e Hardening: Skill `security-and-hardening`
Sempre que a tarefa envolver integrações com WhatsApp (WAHA, Evolution API, Meta Cloud API, Z-API), provedores de Inteligência Artificial (OpenAI, Gemini, Groq, Anthropic), banco de dados (Supabase, PostgreSQL), autenticação, manipulação de variáveis de ambiente (`.env`), webhooks ou formulários com chaves e senhas:

- **Ativação Obrigatória da Skill `security-and-hardening`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `security-and-hardening`** (`.agents/skills/security-and-hardening/SKILL.md`).
  - Ativação **100% autônoma** sempre que houver toque em segurança ou integrações.
- **Diretrizes Mandatórias de Segurança:**
  - **Nunca Expor Segredos no Frontend:** Jamais salvar chaves secretas ou tokens em `localStorage`, `sessionStorage`, cookies client-side ou respostas de endpoints públicos.
  - **Mascaramento Rigoroso:** Em telas e relatórios, exibir apenas identificador e trecho não sensível (ex: `••••••••ABCD`) ou status `Configurado` / `Não configurado`.
  - **Validação Estrita de Webhooks:** Toda entrada de webhook é não confiável por padrão. Validar autenticidade via assinatura criptográfica (HMAC com timing-safe compare sobre corpo bruto) antes de executar ações de negócio.
  - **Idempotência e Proteção contra Replay:** Deduplicar eventos por ID único e validar janelas temporais de timestamps.
  - **Isolamento Absoluto Multi-Tenant:** Garantir que o payload de um tenant nunca acesse ou modifique dados de outro tenant.
  - **Sanitização de Logs e Erros:** Nunca registrar segredos em logs, telemetria, stack traces ou mensagens de erro enviadas ao cliente.

---

### 3. Diagnóstico e Resolução de Erros: Skill `debugging-and-error-recovery`
Sempre que ocorrer falha de deploy no Coolify, erros no Dockerfile, containers marcados como `unhealthy`, problemas de portas ocupadas/bloqueadas (`Connection refused`, `IPv6 vs IPv4`), reinicialização de containers ou erros de execução em produção:

- **Ativação Obrigatória da Skill `debugging-and-error-recovery`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `debugging-and-error-recovery`** (`.agents/skills/debugging-and-error-recovery/SKILL.md`).
  - Ativação **100% autônoma** diante de qualquer erro de build, infraestrutura, deploy ou runtime.
- **Diretrizes Mandatórias de Diagnóstico:**
  - **Diagnóstico Antes da Modificação:** Coletar e inspecionar a primeira mensagem de erro real nos logs do Coolify/Docker antes de propor qualquer correção.
  - **Não Mascarar Sintomas:** Jamais apenas reiniciar o container ou aumentar timeouts para esconder um serviço que não inicializou corretamente.
  - **Mudança Mínima e Precisa:** Alterar somente a causa raiz confirmada por evidências.
  - **Validação Pós-Correção:** Comprovar a recuperação testando a resposta real do serviço (`curl/wget http://127.0.0.1:PORTA/ENDPOINT`) e a transição para `healthy`.

---

### 4. Integração de WhatsApp e Webhooks: Skill `whatsapp-api-and-webhooks`
Sempre que a tarefa envolver gateways de WhatsApp (WAHA, Evolution API, Meta WhatsApp Cloud API), geração e exibição de QR Code, gerenciamento de sessões e instâncias, reconexão automática, fluxos no n8n ou webhooks de mensagens e status:

- **Ativação Obrigatória da Skill `whatsapp-api-and-webhooks`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `whatsapp-api-and-webhooks`** (`.agents/skills/whatsapp-api-and-webhooks/SKILL.md`).
  - Ativação **100% autônoma** sempre que envolver WhatsApp ou mensagens.
- **Tríade Sinérgica Obrigatória:**
  - A skill `whatsapp-api-and-webhooks` **DEVE trabalhar em conjunto com `security-and-hardening`** (para blindar tokens de WhatsApp, mascarar chaves e validar assinaturas HMAC de webhooks) **e com `debugging-and-error-recovery`** (para diagnosticar quedas de container, portas bloqueadas e falhas de healthcheck do gateway no Docker/Coolify).
- **Diretrizes Mandatórias de WhatsApp & Mensageria:**
  - **Gerenciamento Preciso de Estados:** Manter rastreabilidade completa (`CREATED`, `CONNECTING`, `QR_REQUIRED`, `CONNECTED`, `DISCONNECTED`, `RECONNECTING`, `ERROR`, `STOPPED`).
  - **QR Code Seguro:** Exibir somente quando necessário, controlar expiração, remover após autenticação e NUNCA salvar QR Code permanentemente ou em logs.
  - **Webhooks Rápidos e Confiáveis:** Responder ao webhook HTTP rapidamente e delegar processamento pesado para filas assíncronas com tratamento de idempotência e prevenção de loops.
  - **Reconexão com Exponential Backoff:** Reconectar com intervalo progressivo e limites claros, sem contornar autenticações e solicitando intervenção quando um novo QR Code for exigido.
  - **Integração com n8n:** Preservar IDs de mensagens, respeitar pausas de atendimento para operadores humanos e evitar duplicidade.

---

### 5. Engenharia de Prompts e IA Especializada: Skill `prompt-engineering-and-specialized-ai`
Sempre que a tarefa envolver criação, ajuste ou teste de prompts de IA, assistentes virtuais de atendimento por segmento (climatização, elétrica, marcenaria, etc.), extração de dados JSON de conversas, regras de orçamento ou alimentação do CRM Kanban:

- **Ativação Obrigatória da Skill `prompt-engineering-and-specialized-ai`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `prompt-engineering-and-specialized-ai`** (`.agents/skills/prompt-engineering-and-specialized-ai/SKILL.md`).
  - Ativação **100% autônoma** diante de qualquer tarefa de IA, prompts ou assistentes.
- **Diretriz Arquitetural Mandatória de 4 Camadas:**
  - **CAMADA 1 (LLM):** Conversa humanizada, identifica intenções, faz perguntas de triagem e nunca alucina preços ou disponibilidade.
  - **CAMADA 2 (Extração Estruturada):** Transforma a conversa em JSON validável; usa `null` para pendências sem suposições.
  - **CAMADA 3 (Backend Determinístico):** Autoridade máxima comercial. Todos os cálculos de mão de obra, materiais e orçamentos são executados pelo backend (Node.js/Postgres), JAMAIS pela matemática do LLM.
  - **CAMADA 4 (CRM + Kanban):** Atualiza leads sem duplicidade, move cards nas etapas corretas do funil e define próximas ações comerciais.
- **Regras de Autoridade:** A IA interpreta e conversa; o backend calcula, autoriza e executa; o CRM/Kanban persiste e organiza.

---

### 6. Mobile-First e Micro-Interações: Skill `frontend-mobile-first-and-micro-interactions`
Sempre que a tarefa envolver design ou implementação de telas para smartphone, navegação móvel (menu inferior, gaveta lateral, alcance do polegar), microinterações táteis, feedback visual (loading, sucesso, erro, skeletons, prevenção de clique duplo), formulários adaptados para teclado virtual, Kanban mobile ou orçamentos na tela do celular:

- **Ativação Obrigatória da Skill `frontend-mobile-first-and-micro-interactions`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `frontend-mobile-first-and-micro-interactions`** (`.agents/skills/frontend-mobile-first-and-micro-interactions/SKILL.md`).
  - Ativação **100% autônoma** sempre que trabalhar em telas ou componentes da aplicação.
- **Sinergia com `frontend-ui-engineering`:**
  - As duas skills de frontend atuam de forma coordenada: `frontend-ui-engineering` assegura design de nível de agência, tokens visuais e responsividade ampla; `frontend-mobile-first-and-micro-interactions` assegura ergonomia para uso com uma mão, áreas de toque >= 44 a 48px, microinterações de estado, acessibilidade touch e desempenho sob redes móveis.
- **Hierarquia Inegociável:**
  - **Usabilidade → Desempenho → Acessibilidade → Consistência → Estética.**
- **Diretrizes Mandatórias Mobile:**
  - **Áreas de Toque:** Interações com no mínimo 44 a 48px CSS, distanciamento seguro e botões primários acessíveis ao polegar.
  - **Teclado e Formulários:** Tipos adequados de input (`tel`, `email`, `numeric`), preservação de dados em falhas e mensagens de erro contextualizadas.
  - **Microinterações e Bloqueio Duplo:** Toda ação deve ter feedback imediato; botões devem bloquear temporariamente contra duplo clique em requisições assíncronas.
  - **Tratamento de 9 Estados:** Cobrir integralmente: Carregando, Carregado, Vazio (Empty State), Erro, Sem Conexão, Em Andamento, Concluído, Não Autorizado e Desatualizado.
  - **Nenhuma Operação Fictícia:** Jamais confirmar visualmente uma operação antes da validação do backend (ou garantir reversão visual em caso de falha de optimistic update).

---

### 7. Backend Multi-Tenant e Segurança RLS: Skill `backend-multi-tenant-and-security`
Sempre que a tarefa envolver criação, alteração ou consulta de tabelas no PostgreSQL/Supabase, endpoints de API no Node.js/Next.js, regras de autenticação/autorização, manipulação de `tenant_id` ou `organization_id`, upload de arquivos no Storage, relatórios ou processamento assíncrono:

- **Ativação Obrigatória da Skill `backend-multi-tenant-and-security`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `backend-multi-tenant-and-security`** (`.agents/skills/backend-multi-tenant-and-security/SKILL.md`).
  - Ativação **100% autônoma** diante de qualquer operação em banco de dados ou backend.
- **Regra Fundamental de Isolamento:**
  - A empresa ou profissional A **JAMAIS** poderá visualizar, consultar, modificar ou excluir dados da empresa B. O isolamento deve ser garantido no banco de dados e no backend, nunca dependendo exclusivamente de filtros da interface ou de cláusulas `WHERE` manuais.
- **Diretrizes Mandatórias Multi-Tenant:**
  - **Row Level Security (RLS) Mandatório:** Habilitar RLS em todas as tabelas com dados privados. Políticas para `SELECT`, `INSERT`, `UPDATE` e `DELETE` baseadas em `auth.uid()` e associação ativa em `organization_members`.
  - **Anti-IDOR e Resolução de Sessão:** Nunca confiar em `tenant_id` ou `user_id` enviados no payload ou URL pelo frontend. O tenant e as permissões devem ser obtidos exclusivamente a partir da sessão autenticada no backend.
  - **Integridade Referencial Composta:** Garantir que relacionamentos entre tabelas (ex: orçamentos, clientes, serviços) pertençam estritamente à mesma organização.
  - **Proteção do Service Role:** Uso estritamente restrito ao servidor interno. Nunca expor no frontend ou versionamento. Em testes e rotinas comuns de usuários, usar credenciais autenticadas sob RLS.
  - **Armazenamento e Assíncrono:** Arquivos no Supabase Storage organizados por `organization_id` com políticas RLS de storage; filas, jobs e webhooks sempre carregando e validando o `tenant_id`.

---

### 8. DevOps & Infraestrutura: Skill `devops-infrastructure-docker-coolify-vps`
Sempre que a tarefa envolver Docker, Dockerfile, docker-compose, deploys no Coolify, configuração de servidores VPS, healthchecks de containers, rotinas de backup, certificados SSL/HTTPS, monitoramento de recursos (CPU, RAM, disco) ou portas de rede:

- **Ativação Obrigatória da Skill `devops-infrastructure-docker-coolify-vps`:**
  - O agente **DEVE obrigatoriamente consultar e seguir as diretrizes da skill `devops-infrastructure-docker-coolify-vps`** (`.agents/skills/devops-infrastructure-docker-coolify-vps/SKILL.md`).
  - Ativação **100% autônoma** diante de qualquer configuração de containers, infraestrutura ou deploy.
- **Sinergia DevOps:**
  - Trabalha em conjunto com `debugging-and-error-recovery` (diagnóstico de portas, falhas de healthcheck e crashes de container) e `security-and-hardening` (blindagem de chaves SSH, firewall, isolamento de segredos no `.env` e renovação SSL).
- **Hierarquia Inegociável:**
  - **Disponibilidade → Integridade dos dados → Segurança → Recuperação → Eficiência de custos.**
- **Diretrizes Mandatórias de Infraestrutura:**
  - **Persistência Segura:** O filesystem do container é volátil. Dados críticos (Postgres, arquivos, uploads) devem residir estritamente em volumes persistentes. Jamais executar `docker system prune --volumes` sem autorização explícita e backup validado.
  - **Healthchecks Confiáveis:** Não aceitar status de container "up" sem validar a resposta HTTP real da aplicação (`/health` ou `/ready` retornando `200`).
  - **Estratégia de Backup 3-2-1:** Backups automatizados do banco de dados (ex: `pg_dump`), validação periódica de integridade e cópia armazenada fora da VPS primária.
  - **Deploy Seguro e Rollback:** Testar builds antes de promover a produção e manter histórico de imagem/versão estável para reversão imediata em caso de falha.
  - **Monitoramento Centralizado e Alertas Inteligentes:** Monitoramento contínuo de VPS, containers, PostgreSQL, endpoints de saúde, backups e SSL. Alertas categorizados (Crítico, Atenção, Informativo) via Telegram/WhatsApp, com deduplicação, notificação de recuperação e arquitetura leve (Uptime Kuma, métricas).




