---
trigger: always_on
---

# Regra Permanente: WhatsApp API and Webhooks Automático (Tríade Sinérgica)

Sempre que a tarefa envolver:
- Gateways e instâncias de WhatsApp (WAHA, Evolution API, Meta WhatsApp Cloud API)
- Geração, exibição ou ciclo de vida de QR Code
- Gerenciamento de sessões (estados `CONNECTING`, `QR_REQUIRED`, `CONNECTED`, etc.)
- Envio, recebimento, formatação ou filas de mensagens do WhatsApp
- Webhooks de mensagens recebidas, status de entrega (`DELIVERED`, `READ`) ou desconexão
- Rotinas de reconexão automática e tratamento de quedas de sessão
- Integrações entre WhatsApp e workflows do n8n

**Ações Obrigatórias do Agente (Tríade Sinérgica):**
1. **Integração Funcional:** Consulte e aplique as diretrizes de `whatsapp-api-and-webhooks` (`.agents/skills/whatsapp-api-and-webhooks/SKILL.md`).
2. **Proteção e Segurança:** Acione simultaneamente `security-and-hardening` (`.agents/skills/security-and-hardening/SKILL.md`) para mascarar chaves e tokens, validar assinaturas HMAC de webhooks sobre o corpo bruto, assegurar isolamento multi-tenant e sanitizar logs.
3. **Resiliência e Recuperação:** Acione simultaneamente `debugging-and-error-recovery` (`.agents/skills/debugging-and-error-recovery/SKILL.md`) caso ocorram falhas de conexão, portas bloqueadas ou containers de gateway com status `unhealthy`.
