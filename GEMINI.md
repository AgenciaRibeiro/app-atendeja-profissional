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
