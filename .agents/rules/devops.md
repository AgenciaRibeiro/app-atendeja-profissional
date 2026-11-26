---
trigger: always_on
---

# Regra Permanente: DevOps & Infraestrutura — Docker, Coolify e VPS

Sempre que a tarefa envolver Docker, Dockerfile, docker-compose, deploys no Coolify, configuração de servidores VPS, healthchecks de containers, rotinas de backup, certificados SSL/HTTPS, monitoramento de recursos (CPU, RAM, disco) ou portas de rede:

- **Ativação Obrigatória:** Aplique e consulte imediatamente a skill `devops-infrastructure-docker-coolify-vps` (`.agents/skills/devops-infrastructure-docker-coolify-vps/SKILL.md`).
- **Sinergia Operacional:** Atue em conjunto com:
  - `debugging-and-error-recovery`: para investigar falhas de build, containers em loop de reinicialização ou status `unhealthy`.
  - `security-and-hardening`: para isolar segredos no servidor, configurar SSH por chave, restringir portas e validar firewalls.
- **Hierarquia Inegociável:** Priorize sempre: **Disponibilidade → Integridade dos dados → Segurança → Recuperação → Eficiência de custos.**
- **Preservação de Volumes:** O filesystem de um container NUNCA é persistente. Jamais remover volumes (`docker system prune --volumes`) sem autorização e verificação de backups.
- **Healthchecks Reais:** Não confundir container rodando com aplicação saudável. Validar se o endpoint HTTP (`/health` ou `/ready`) realmente responde `200 OK`.
- **Estratégia de Backups 3-2-1:** Garantir backups automatizados do banco de dados (ex: `pg_dump`), validação periódica da integridade dos arquivos e armazenamento fora da VPS principal.
- **Deploy Seguro e Rollback:** Testar builds antes de promover a produção e manter histórico de imagem/versão estável para reversão imediata em caso de falha.
- **Monitoramento Centralizado e Alertas:** Monitorar continuamente VPS, containers, PostgreSQL, endpoints de saúde, backups e certificados SSL. Alertas categorizados (Crítico, Atenção, Informativo) via Telegram/WhatsApp com deduplicação, notificação de recuperação e sem comprometer recursos da VPS.
