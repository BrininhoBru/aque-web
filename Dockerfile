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
RUN npm ci

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

# Gera certificado auto-assinado para HTTPS local
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/aque.key \
      -out /etc/nginx/certs/aque.crt \
      -subj "/CN=aque.local/O=Aque/C=BR"

EXPOSE 80 443
