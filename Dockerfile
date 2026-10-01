# ── Etapa 1: Build del Frontend React ───────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/client2
COPY client2/package*.json ./
RUN npm install
COPY client2/ ./
RUN npm run build

# ── Etapa 2: Servidor Node.js + Frontend construido ──────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias del servidor
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copiar código del servidor
COPY server/ ./server/

# Copiar el build del frontend generado en etapa 1
COPY --from=frontend-build /app/client2/dist ./client2/dist

# Crear carpeta para la base de datos SQLite (se usará volumen persistente)
RUN mkdir -p /data

# Variable de entorno para la BD
ENV DB_PATH=/data/database.sqlite
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server/index.js"]
