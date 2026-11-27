#!/usr/bin/env bash
# ==============================================================================
# AtendeJá Profissional — Script de Restauração Segura em Ambiente Isolado
# Governança: AGENTS.md | Skill: devops-infrastructure-docker-coolify-vps
# ATENÇÃO: NUNCA EXECUTAR DIRETAMENTE SOBRE O BANCO DE PRODUÇÃO!
# ==============================================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <caminho_do_arquivo_backup.sql.gz> [DATABASE_URL_DESTINO_ISOLADO]"
  echo "Exemplo: $0 /backups/postgres/atendeja_db_20261126_220000.sql.gz postgresql://user:pass@localhost:5433/atendeja_isolado"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_URL="${2:-${TARGET_DATABASE_URL:-}}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "[ERRO] Arquivo de backup não encontrado: ${BACKUP_FILE}" >&2
  exit 1
fi

if [[ -z "${TARGET_URL}" ]]; then
  echo "[ERRO] URL de destino não informada. Defina TARGET_DATABASE_URL ou passe como segundo argumento." >&2
  echo "[SEGURANÇA] Bloqueado para evitar restauração acidental sobre produção." >&2
  exit 1
fi

# Trava de segurança contra execução em produção
if [[ "${TARGET_URL}" == *"atendeja.minhaempresaautonoma"* || "${TARGET_URL}" == *"kunpzzmubfvzmweyxfjp"* ]]; then
  echo "[BLOQUEIO CRÍTICO] A URL informada parece ser de PRODUÇÃO!" >&2
  echo "[BLOQUEIO CRÍTICO] Testes de restauração devem ser executados estritamente em banco isolado/local." >&2
  exit 1
fi

echo "[INFO] $(date -Iseconds) - Validando arquivo gzip..."
gzip -t "${BACKUP_FILE}"

echo "[INFO] $(date -Iseconds) - Iniciando restauração em banco isolado..."
gunzip -c "${BACKUP_FILE}" | psql "${TARGET_URL}" -v ON_ERROR_STOP=1

echo "[SUCESSO] $(date -Iseconds) - Restauração no ambiente isolado concluída com sucesso!"

echo "[INFO] Executando smoke test pós-restauração..."
psql "${TARGET_URL}" -t -c "SELECT 'Total de tabelas restauradas: ' || count(*) FROM information_schema.tables WHERE table_schema = 'public';"
