---
trigger: always_on
---

# Regra Permanente: Security and Hardening Automático

Sempre que a tarefa envolver:
- Integrações e conexões com WhatsApp (WAHA, Evolution API, Meta Cloud API, Z-API)
- Provedores e chaves de IA (OpenAI, Gemini, Groq, Anthropic)
- Manipulação de chaves de API, tokens, senhas ou variáveis de ambiente (`.env`)
- Endpoints de Webhooks, callbacks e validações de assinatura HMAC
- Telas de configuração com credenciais (`dashboard.html`, `admin.html`)
- Isolamento de dados entre empresas (multi-tenant) e sanitização de logs/erros

**Ações Obrigatórias do Agente:**
1. Consulte e aplique as diretrizes da skill `security-and-hardening` (`.agents/skills/security-and-hardening/SKILL.md`).
2. Mascare qualquer credencial exibida no frontend ou retornada por APIs de consulta.
3. Não salve chaves privadas no código, nem no `localStorage`.
4. Garanta validação criptográfica estrita sobre corpos brutos em webhooks e impeça que eventos de um cliente acessem registros de outro.
