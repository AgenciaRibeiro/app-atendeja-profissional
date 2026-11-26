---
trigger: always_on
---

# Regra Permanente: Onboarding Sem Atrito (Zero Friction)

Sempre que a tarefa envolver telas de criação de conta, cadastro de empresa/profissional, fluxo de primeiro acesso, conexão de WhatsApp via QR Code, wizard inicial ou ativação de novos usuários:

- **Ativação Obrigatória:** Aplique e consulte imediatamente a skill `onboarding-sem-atrito-zero-friction` (`.agents/skills/onboarding-sem-atrito-zero-friction/SKILL.md`).
- **Máximo de 3 Etapas:**
  1. *Etapa 1 — Criar Conta:* Nome, e-mail, senha e nome da empresa/atividade. Validação imediata e criação automática do tenant isolado no backend.
  2. *Etapa 2 — Conectar WhatsApp:* Apresentação limpa de QR Code gerado pelo backend. O usuário JAMAIS preenche URLs, webhooks, tokens ou portas manuais.
  3. *Etapa 3 — Boas-Vindas e Acesso Direto:* Confirmação de status real, identificação do número conectado e liberação imediata do painel principal com microinterações acolhedoras.
- **Sinergia Obrigatória Multi-Skill:**
  - `frontend-mobile-first-and-micro-interactions`: Layout mobile-first, botões de toque >= 44px, QR Code responsivo e sem rolagem horizontal.
  - `whatsapp-api-and-webhooks`: Orquestração segura de instâncias WAHA / Evolution API / Meta Cloud API nos bastidores, com tratamento de expiração e renovação do QR Code.
  - `backend-multi-tenant-and-security`: Vinculação automática ao `tenant_id` correto com RLS ativo desde o milissegundo zero da criação da conta.
  - `copywriting-focused-on-service-provider-objections`: Textos empáticos, em linguagem simples e acolhedora, sem jargões técnicos.
- **Cobertura Visual dos 8 Estados de Conexão:**
  *Não conectado, Preparando conexão, Aguardando leitura do QR Code, Conectando, Conectado, Conexão expirada, Falha na conexão e Desconectado*.
- **Segurança Rigorosa:** Credenciais administrativas, chaves da API e segredos NUNCA são expostos no frontend.
