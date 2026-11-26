---
trigger: always_on
---

# Regra Permanente: WhatsApp API and Webhooks Automático

Sempre que a tarefa envolver:
- Gateways e instâncias de WhatsApp (WAHA, Evolution API, Meta WhatsApp Cloud API)
- Geração, exibição ou ciclo de vida de QR Code
- Gerenciamento de sessões (estados `CONNECTING`, `QR_REQUIRED`, `CONNECTED`, etc.)
- Envio, recebimento, formatação ou filas de mensagens do WhatsApp
- Webhooks de mensagens recebidas, status de entrega (`DELIVERED`, `READ`) ou desconexão
- Rotinas de reconexão automática e tratamento de quedas de sessão
- Integrações entre WhatsApp e workflows do n8n

**Ações Obrigatórias do Agente:**
1. Consulte e aplique as diretrizes da skill `whatsapp-api-and-webhooks` (`.agents/skills/whatsapp-api-and-webhooks/SKILL.md`).
2. Trate a arquitetura específica de cada provedor conforme sua documentação oficial, sem assumir que todos se comportam da mesma forma.
3. Não salve QR Codes permanentemente nem exponha tokens de WhatsApp no frontend ou em logs.
4. Garanta idempotência no processamento de eventos para evitar mensagens ou ações duplicadas.
