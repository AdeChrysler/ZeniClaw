FROM ghcr.io/openclaw/openclaw:latest

USER root

# Copy openclaw config into the image (not mounted as volume, stays in image layer)
COPY openclaw/openclaw.json /home/node/.openclaw/openclaw.json

# Install WhatsApp and Telegram plugins at build time
# These go into image layers, NOT overridden by volume mounts since we only mount subdirs
RUN openclaw plugins install @openclaw/whatsapp 2>&1 || echo "[build] whatsapp plugin — retry at runtime"
RUN openclaw plugins install @openclaw/telegram 2>&1 || echo "[build] telegram plugin — retry at runtime"

# Copy skills into workspace
RUN mkdir -p /home/node/.openclaw/workspace/skills
COPY skills/ /home/node/.openclaw/workspace/skills/

# Copy init/startup script
COPY openclaw/start.sh /usr/local/bin/openclaw-start.sh
RUN chmod +x /usr/local/bin/openclaw-start.sh

RUN chown -R node:node /home/node/.openclaw

USER node

EXPOSE 18789

CMD ["/bin/sh", "/usr/local/bin/openclaw-start.sh"]
