FROM node:22-alpine AS builder

WORKDIR /app

ARG ASTRO_SITE
ARG ASTRO_BASE
ARG NPM_REGISTRY=https://registry.npmjs.org

ENV ASTRO_SITE=${ASTRO_SITE}
ENV ASTRO_BASE=${ASTRO_BASE}
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY package.json package-lock.json ./
RUN npm ci

COPY astro.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmjs.org
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
