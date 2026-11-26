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
- **Diretrizes Mandatórias de WhatsApp & Mensageria:**
  - **Gerenciamento Preciso de Estados:** Manter rastreabilidade completa (`CREATED`, `CONNECTING`, `QR_REQUIRED`, `CONNECTED`, `DISCONNECTED`, `RECONNECTING`, `ERROR`, `STOPPED`).
  - **QR Code Seguro:** Exibir somente quando necessário, controlar expiração, remover após autenticação e NUNCA salvar QR Code permanentemente ou em logs.
  - **Webhooks Rápidos e Confiáveis:** Responder ao webhook HTTP rapidamente e delegar processamento pesado para filas assíncronas com tratamento de idempotência e prevenção de loops.
  - **Reconexão com Exponential Backoff:** Reconectar com intervalo progressivo e limites claros, sem contornar autenticações e solicitando intervenção quando um novo QR Code for exigido.
  - **Integração com n8n:** Preservar IDs de mensagens, respeitar pausas de atendimento para operadores humanos e evitar duplicidade.
