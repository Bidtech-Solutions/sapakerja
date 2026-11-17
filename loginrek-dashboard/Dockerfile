# syntax=docker/dockerfile:1
# Build context: loginrek-dashboard/
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.sapakerja.com \
#                --build-arg NEXT_PUBLIC_SITE_URL=https://sapakerja.com \
#                --build-arg NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX   (opsional) \
#                -t loginrek-dashboard loginrek-dashboard
#
# Next.js (App Router) mode `standalone`: satu server Node kecil yang melayani situs publik (/ dan /privacy) dan dashboard HR
# (/login, /attendance, /employees, /settings). Semua halaman dirender per permintaan karena bahasa dibaca dari cookie/header
# (lihat i18n/server.ts). TLS, domain, dan header keamanan ditangani Traefik (lihat docker-compose.prod.yml).
#
# Catatan build: `next build` mengunduh font Google (next/font) sekali lalu meng-host-nya sendiri, jadi tahap build butuh akses
# internet ke fonts.googleapis.com; peramban pengunjung tidak pernah menghubungi Google Fonts.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* dibakar ke bundle saat build. API wajib diisi: CI mengisinya dari env API_DOMAIN di workflow,
# compose dari API_DOMAIN. Tanpa ini request dashboard relatif ke domain sendiri dan gagal (API ada di domain terpisah).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL=https://sapakerja.com
ARG NEXT_PUBLIC_GA_ID=
ARG NEXT_PUBLIC_GTM_ID=
ARG NEXT_PUBLIC_GSC_VERIFICATION=
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "ERROR: build-arg NEXT_PUBLIC_API_URL wajib diisi"; exit 1; }
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_GSC_VERIFICATION=$NEXT_PUBLIC_GSC_VERIFICATION \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Pengguna non-root; .next/cache ditulis saat runtime (cache optimasi gambar next/image, mis. badge toko).
RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app app
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown -R app:app .next
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health.json >/dev/null || exit 1
CMD ["node", "server.js"]
