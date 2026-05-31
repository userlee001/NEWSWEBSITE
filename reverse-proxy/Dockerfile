# ===== writer frontend =====
FROM node:22 AS writer-builder

WORKDIR /app

COPY writer-frontend/package*.json ./
RUN npm install

COPY writer-frontend ./

RUN npm run build && mv dist writer-frontend

# ===== reader frontend =====
FROM node:22 AS reader-builder

WORKDIR /app

COPY reader-frontend/package*.json ./
RUN npm install

COPY reader-frontend ./

RUN npm run build && mv dist reader-frontend

# ===== admin frontend =====
FROM node:22 AS admin-builder

WORKDIR /app

COPY administrator-panel/package*.json ./
RUN npm install

COPY administrator-panel ./

RUN npm run build && mv dist administrator-panel

# ===== nginx =====
FROM nginx:1.29.6-alpine

COPY reverse-proxy/nginx.conf /etc/nginx/conf.d/default.conf

# writer
COPY --from=writer-builder /app/writer-frontend /usr/share/nginx/html/writer-frontend

# reader
COPY --from=reader-builder /app/reader-frontend /usr/share/nginx/html/reader-frontend

# admin
COPY --from=admin-builder /app/administrator-panel /usr/share/nginx/html/administrator-panel


