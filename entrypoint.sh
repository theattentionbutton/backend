#!/bin/sh
# If FRP_SERVER_ADDR is set, generate an frpc config from env vars and start
# frpc as a background process to tunnel the MQTT port (1883) out to the
# ingress node. If it's unset (local dev, or anyone else building this public
# image), frpc is skipped entirely -- no ingress details are required or
# baked into the image either way.
#
# Env vars:
#   FRP_SERVER_ADDR         required to enable the tunnel, no default
#   FRP_SERVER_PORT         default 7000
#   FRP_TRANSPORT_PROTOCOL  default kcp
#   FRP_MQTT_REMOTE_PORT    default 1883
set -e

if [ -n "$FRP_SERVER_ADDR" ]; then
    cat > /tmp/frpc.toml <<EOF
serverAddr = "${FRP_SERVER_ADDR}"
serverPort = ${FRP_SERVER_PORT:-7000}
transport.protocol = "${FRP_TRANSPORT_PROTOCOL:-kcp}"

[[proxies]]
name = "theattentionbutton-mqtt"
type = "tcp"
localIP = "127.0.0.1"
localPort = 1883
remotePort = ${FRP_MQTT_REMOTE_PORT:-1883}
EOF
    frpc -c /tmp/frpc.toml &
fi

exec "$@"
