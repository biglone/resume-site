FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_DIR=/app/data

RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "src/index.js"]
