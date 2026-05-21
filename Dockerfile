FROM node:24-alpine AS builder

WORKDIR /app

# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY src/ ./src/
COPY templates/ ./templates/
COPY public/ ./public/

FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN corepack enable

COPY --from=builder /app/src/ ./src/
COPY --from=builder /app/templates/ ./templates/
COPY --from=builder /app/public/ ./public/

RUN mkdir -p /app/storage

ENV NODE_ENV=production

USER node
EXPOSE 8000

CMD ["dumb-init", "node", "src/main.ts"]
