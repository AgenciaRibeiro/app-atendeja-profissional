# ============================================================
# AtendeJá Profissional - Production Docker Build
# ============================================================

FROM node:22-alpine AS runtime

WORKDIR /app

# Criar grupo e usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --omit=dev --no-audit --no-fund

# Copiar os arquivos da aplicação (respeitando o .dockerignore)
COPY . .

# Definir permissões para usuário não-root
RUN chown -R appuser:appgroup /app

USER appuser

# Expor porta da aplicação
EXPOSE 3000

# Healthcheck do container (usando 127.0.0.1 para evitar resolução de IPv6 no Alpine)
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]
