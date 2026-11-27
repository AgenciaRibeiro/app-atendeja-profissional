# Relatório de Auditoria e Implementação — Etapa 02: Backup e Recuperação

> **Projeto:** AtendeJá Profissional  
> **Etapa:** 02 — Backup e Recuperação  
> **Data:** 2026-11-26  
> **Status da Etapa 02:** Concluída para Avaliação  
> **Autoridade:** JR (Proprietário do Produto)  
> **Skills Aplicadas:** `devops-infrastructure-docker-coolify-vps` e `backend-multi-tenant-and-security`  

---

## 1. Objetivo da Etapa 02

Estabelecer a arquitetura, as rotinas automatizadas, os scripts e o Procedimento Operacional Padrão (POP) de backup e recuperação para todos os componentes do ecossistema AtendeJá Profissional:
1. **Banco Operacional de Clientes (PostgreSQL no Coolify/Docker)**.
2. **Banco de Controle Administrativo (Supabase Control Plane)**.
3. **Workflows de Integração e Pagamento (n8n)**.
4. **Variáveis de Ambiente e Segredos de Infraestrutura**.

Garantir que antes de qualquer alteração de código ou banco de dados nas etapas seguintes, exista um processo de salvamento íntegro e um protocolo de recuperação testado em ambiente isolado.

---

## 2. Inventário Arquitetural de Dados e Componentes

| Componente | Local de Execução | Dados Persistidos | RPO Alvo | RTO Alvo | Estratégia de Backup |
|---|---|---|---|---|---|
| **PostgreSQL Clientes** | Container Docker (VPS Coolify) | 10 tabelas operacionais (leads, mensagens, histórico, planos, assistentes) | 24 horas | 1 hora | Dump lógico diário (`pg_dump`) comprimido com rotação de 7 dias via script `scripts/backup/backup_postgres.sh`. |
| **Supabase Control Plane** | Nuvem Supabase (`kunpzzmubfvzmweyxfjp`) | 5 tabelas administrativas (orgs, membros, planos, clientes, pagamentos) + 11 RPCs | 24 horas (ou PITR contínuo) | 30 minutos | Snapshots diários gerenciados pela AWS/Supabase + Schema declarativo versionado em `db/supabase_control_plane.sql`. |
| **Workflows n8n** | Servidor n8n (`https://n8n...`) | Workflows de checkout, Pix, cartão e webhook | 24 horas | 15 minutos | Exportações JSON versionadas em `backups/n8n/` via script de automação MCP. |
| **Variáveis de Ambiente** | Servidor / Coolify | `.env`, segredos de webhook, tokens JWT | Por deploy | 15 minutos | Backup criptografado no cofre de segredos do Coolify e Keepass/Bitwarden seguro. |

---

## 3. Scripts Desenvolvidos e Entregues

Foram criados e validados scripts dedicados no repositório:

### 3.1 `scripts/backup/backup_postgres.sh`
- **Função:** Executa `pg_dump` com compressão `gzip -9`, flags defensivas (`--clean --if-exists --quote-all-identifiers`), validação de tamanho maior que zero, teste de integridade gzip (`gzip -t`) e rotação automática de retenção local (padrão: 7 dias).
- **Compatibilidade:** Funciona via variáveis de conexão padrão (`DATABASE_URL` ou `PG*`), ideal para agendamento cron na VPS ou job no Coolify.

### 3.2 `scripts/backup/restore_postgres.sh`
- **Função:** Procedimento automatizado de restauração segura.
- **Trava de Segurança Inviolável:** O script possui bloqueio automático caso a URL de destino contenha termos de produção (`atendeja.minhaempresaautonoma` ou `kunpzzmubfvzmweyxfjp`), impedindo restauração acidental sobre o banco ativo.
- **Smoke Tests Embutidos:** Executa verificação de contagem de tabelas restauradas após a descompressão.

### 3.3 `backups/n8n/` (Cópias Imutáveis dos Workflows)
Foram exportados e armazenados com sucesso:
- `backups/n8n/kawt70Q2DuuG0pMo_MercadoPago_Pix_Cartao_WAHA.json` (Workflow ativo principal de pagamentos Mercado Pago + WAHA).
- `backups/n8n/tmiMFW7MwRAZ7XK6_Status_Pagamento.json` (Workflow ativo de verificação de status de pagamento).
- `backups/n8n/RN5fo9acYbGIVujC_Pix_Direto_WAHA.json` (Workflow inativo de Pix direto).

---

## 4. Política de Retenção e Regra 3-2-1

Em conformidade com a skill `devops-infrastructure-docker-coolify-vps`:

1. **3 Cópias dos Dados:**
   - Cópia 1 (Produção): Volume ativo no PostgreSQL do Docker.
   - Cópia 2 (Local VPS): Armazenamento em `/backups/postgres` na VPS.
   - Cópia 3 (Off-site): Envio diário criptografado para Storage de Objetos externo (ex.: S3 / Backblaze B2 / Google Drive).
2. **2 Mídias Diferentes:**
   - Disco SSD/NVMe da VPS (sistema de arquivos local) e Cloud Object Storage.
3. **1 Cópia Fora da Infraestrutura Primária:**
   - Garantir que um desastre na VPS não destrua o histórico de backups.
4. **Política de Retenção Recomendada:**
   - Backups diários: retidos por 7 dias.
   - Backups semanais (domingo): retidos por 4 semanas.
   - Backups mensais (dia 1º): retidos por 3 meses.

---

## 5. Procedimento Operacional Padrão (POP) de Restauração em 5 Etapas

Em caso de incidente ou teste periódico:

1. **Etapa 1 — Isolar e Preservar:** Isolar a instância com falha e preservar os logs do container (`docker logs <container> > incidente.log`).
2. **Etapa 2 — Subir Ambiente Isolado:** Criar um container Docker temporário em porta alternativa (ex.: 5433) ou um banco limpo `atendeja_isolado`.
3. **Etapa 3 — Executar Restauração:** Executar `./scripts/backup/restore_postgres.sh <arquivo.sql.gz> <URL_ISOLADA>`.
4. **Etapa 4 — Validação de Integridade (Smoke Test):**
   - Confirmar as 10 tabelas operacionais em `information_schema.tables`.
   - Testar a função RLS `public.current_client_id()`.
   - Realizar consulta `SELECT count(*) FROM leads;`.
5. **Etapa 5 — Homologação e Troca:** Apenas com a validação completa e o aceite formal de JR, promover o banco restaurado para produção.

---

## 6. Conclusão e Critérios de Aceite

A **Etapa 02** atende integralmente aos critérios do plano mestre:
- [x] Inventário completo de dados mapeado.
- [x] Scripts de backup e restore com travas de segurança desenvolvidos e versionados.
- [x] Backups dos workflows de integração n8n extraídos e salvos.
- [x] POP de recuperação em ambiente isolado documentado.
- [x] Zero impacto ou alterações destrutivas em produção.
