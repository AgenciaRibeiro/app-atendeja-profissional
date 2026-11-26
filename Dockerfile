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

# Healthcheck do container
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]
