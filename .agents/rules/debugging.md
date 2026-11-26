---
trigger: always_on
---

# Regra Permanente: Debugging and Error Recovery Automático

Sempre que a tarefa envolver:
- Falhas de deploy, build ou importação no Coolify
- Containers Docker com status `unhealthy`, `exited` ou reiniciando em loop
- Erros de porta ou conexão (`Connection refused`, portas bloqueadas, IPv6 `[::1]` vs IPv4 `127.0.0.1`)
- Falhas de sintaxe ou configuração em `Dockerfile`, scripts de healthcheck ou Node.js
- Erros de runtime e exceções não tratadas

**Ações Obrigatórias do Agente:**
1. Consulte e aplique as diretrizes da skill `debugging-and-error-recovery` (`.agents/skills/debugging-and-error-recovery/SKILL.md`).
2. Colete e analise os logs da primeira falha real antes de propor qualquer mudança.
3. Não use tentativa e erro; aplique a menor mudança suficiente para resolver a causa raiz.
4. Valide a recuperação com testes no endpoint e verificação de saúde do container.
