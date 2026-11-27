#!/usr/bin/env bash
# ==============================================================================
# AtendeJá Profissional — Script Automatizado de Backup do PostgreSQL (Coolify)
# Governança: AGENTS.md | Skill: devops-infrastructure-docker-coolify-vps
# ==============================================================================
set -euo pipefail

# Configurações com fallback
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/atendeja_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Checagem de variáveis essenciais
if [[ -z "${DATABASE_URL:-}" && -z "${PGDATABASE:-}" ]]; then
  echo "[ERRO] $(date -Iseconds) - DATABASE_URL ou variáveis PG* não definidas." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

echo "[INFO] $(date -Iseconds) - Iniciando backup do banco de dados operacional..."

# Execução do dump com compressão em pipeline
if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump "${DATABASE_URL}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --quote-all-identifiers \
    | gzip -9 > "${BACKUP_FILE}"
else
  pg_dump \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --quote-all-identifiers \
    | gzip -9 > "${BACKUP_FILE}"
fi

# Validação do arquivo gerado
if [[ ! -s "${BACKUP_FILE}" ]]; then
  echo "[ERRO] $(date -Iseconds) - O arquivo de backup gerado está vazio ou inexistente: ${BACKUP_FILE}" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[SUCESSO] $(date -Iseconds) - Backup concluído com sucesso: ${BACKUP_FILE} (Tamanho: ${BACKUP_SIZE})"

# Teste de integridade básica do gzip
if gzip -t "${BACKUP_FILE}"; then
  echo "[INFO] $(date -Iseconds) - Teste de integridade gzip: APROVADO."
else
  echo "[ERRO] $(date -Iseconds) - Arquivo de backup corrompido!" >&2
  exit 1
fi

# Rotação e limpeza de backups antigos
echo "[INFO] $(date -Iseconds) - Aplicando política de retenção (${RETENTION_DAYS} dias)..."
find "${BACKUP_DIR}" -name "atendeja_db_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "[INFO] $(date -Iseconds) - Rotina de rotação concluída."
