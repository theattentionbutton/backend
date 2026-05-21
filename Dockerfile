FROM node:24-alpine AS builder

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY src/ ./src/
COPY templates/ ./templates/
COPY public/ ./public/

FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/pnpm-lock.yaml /app/package.json ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/src/ ./src/
COPY --from=builder /app/templates/ ./templates/
COPY --from=builder /app/public/ ./public/

RUN mkdir -p /app/storage

ENV NODE_ENV=production

USER node

CMD ["dumb-init", "node", "src/main.ts"]
