FROM ghcr.io/openclaw/openclaw:latest

USER root

# Install WhatsApp and Telegram plugins at build time (failures are non-fatal)
RUN openclaw plugins install @openclaw/whatsapp 2>&1 || echo "[build] whatsapp plugin install — will retry at runtime"
RUN openclaw plugins install @openclaw/telegram 2>&1 || echo "[build] telegram plugin install — will retry at runtime"

# Create workspace directories
RUN mkdir -p /home/node/.openclaw/workspace/skills \
    && mkdir -p /home/node/.openclaw/agents \
    && chown -R node:node /home/node/.openclaw

USER node

EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789", "--verbose"]
