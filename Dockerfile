FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS api-build

COPY tsconfig.json ./
COPY src ./src
RUN npm run build:api

FROM dependencies AS web-build

COPY web ./web
RUN npm run build:web

FROM node:24-alpine AS api-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-alpine AS api

WORKDIR /app
ENV NODE_ENV=production
ARG APP_VERSION=0.1.0
ENV APP_VERSION=$APP_VERSION

COPY --from=api-dependencies /app/node_modules ./node_modules
COPY --from=api-build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]

FROM nginx:1.29-alpine AS web

ARG APP_VERSION=0.1.0
ENV APP_VERSION=$APP_VERSION
ENV API_UPSTREAM=http://api:3000

COPY web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=web-build /app/dist/web /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/healthz || exit 1
