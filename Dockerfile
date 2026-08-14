# syntax=docker/dockerfile:1

# ── frpc download stage ────────────────────────────────────────────────────────
FROM alpine:3.22 AS frpc-download
ARG FRP_VERSION=0.69.1
RUN apk add --no-cache curl tar
RUN curl -fsSL \
    "https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_arm64.tar.gz" \
    | tar -xz --strip-components=1 -C /tmp \
    && install -m 755 /tmp/frpc /usr/local/bin/frpc

FROM node:24-alpine AS builder

WORKDIR /app

# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 make gcc g++ && ln -sf python3 /usr/bin/python

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY src/ ./src/
COPY templates/ ./templates/
COPY public/ ./public/

FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# frpc binary only — no static frpc.toml here on purpose, this repo is
# public and the ingress address/port must not be baked into the image.
# entrypoint.sh generates the config at container start from env vars, and
# only runs frpc at all if FRP_SERVER_ADDR is set (unset -> plain local/dev
# container, no tunnel, no ingress details required or leaked).
COPY --from=frpc-download /usr/local/bin/frpc /usr/local/bin/frpc

COPY --from=builder /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN corepack enable

COPY --from=builder /app/src/ ./src/
COPY --from=builder /app/templates/ ./templates/
COPY --from=builder /app/public/ ./public/

RUN mkdir -p /app/storage

ENV NODE_ENV=production

# Custom entrypoint: conditionally starts frpc (only if FRP_SERVER_ADDR is
# set), then hands off to the app's own CMD (dumb-init node src/main.ts),
# preserved via "$@".
COPY entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh

USER node
EXPOSE 8000
# 1883 is only actually reachable from outside when FRP_SERVER_ADDR is set
# and frpc tunnels it out; EXPOSE here is documentation, not a guarantee.
EXPOSE 1883

ENTRYPOINT ["/custom-entrypoint.sh"]
CMD ["dumb-init", "node", "src/main.ts"]
