# =============================================================================
# Aque — Frontend Dockerfile (multi-stage, Angular + Nginx)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build — compila o Angular em produção
# -----------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

WORKDIR /app

# Copia apenas package.json primeiro para aproveitar cache de dependências
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copia o código fonte e compila
COPY . .
RUN npm run build -- --configuration production

# -----------------------------------------------------------------------------
# Stage 2: Runtime — Nginx serve os arquivos estáticos via HTTPS
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos gerados pelo Angular
COPY --from=build /app/dist/aque-web/browser /usr/share/nginx/html

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx.conf e certs/ são bind mounts em produção (ver docker-compose.yml no
# Rasp) — não há mais geração de certificado aqui, seria sempre sobrescrita

EXPOSE 80 443