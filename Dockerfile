============================================================
AtendeJá Profissional - Docker Multi-Stage Build
============================================================
Otimizações: imagem menor, não-root, healthcheck, security

--- Stage 1: Build ---
FROM node:22-alpine AS builder
WORKDIR /app

Instalar apenas dependências de produção + build tools
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm prune --production

Copy source (apenas o necessário)
COPY server.js ./
COPY index.html ./
COPY dashboard.html ./
COPY admin.html ./
COPY styles.css ./
COPY dashboard.css ./
COPY admin.css ./
COPY app.js ./
COPY admin.js ./
COPY package.json ./

--- Stage 2: Runtime (não-root) ---
FROM node:22-alpine AS runtime
WORKDIR /app

Criar usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

Copiar dependências da stage builder
COPY --from=builder /app/node_modules ./node_modules
Copiar arquivos da stage builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/index.html ./
COPY --from=builder /app/dashboard.html ./
COPY --from=builder /app/admin.html ./
COPY --from=builder /app/styles.css ./
COPY --from=builder /app/dashboard.css ./
COPY --from=builder /app/admin.css ./
COPY --from=builder /app/app.js ./
COPY --from=builder /app/admin.js ./
COPY --from=builder /app/package.json ./

Definir permissões não-root
RUN chown -R appuser:appgroup /app
USER appuser

Expor porta
EXPOSE 3000

Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

Comando de inicialização
CMD ["npm", "start"]