# Multi-stage: dev (vite dev-server) / prod (build -> nginx servi statique, SPA fallback)
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev-task"]

FROM node:22-alpine AS build
WORKDIR /app
# VITE_HOST doit être fourni au build pour être encré dans le bundle
ARG VITE_HOST=""
ENV VITE_HOST=$VITE_HOST
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS prod
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
