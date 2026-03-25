FROM ghcr.io/openclaw/openclaw:main

USER root

# Bake openclaw config into image (not volume-mounted, so it persists across restarts)
# Config written to /app/.openclaw-config/ and copied by start.sh to $HOME/.openclaw/
# (volumes mount /home/node/.openclaw/sessions and /agents, not the config dir)
RUN mkdir -p /app/.openclaw-config
COPY openclaw/openclaw.json /app/.openclaw-config/openclaw.json

# Copy CEO assistant skill into OpenClaw workspace
RUN mkdir -p /app/skills/ceo-assistant
COPY skills/ceo-assistant/SKILL.md /app/skills/ceo-assistant/SKILL.md

# Install socat for port forwarding (needed since --bind lan crashes in Coolify Docker)
RUN apt-get update && apt-get install -y --no-install-recommends socat && rm -rf /var/lib/apt/lists/*

# Create .openclaw directory structure with node ownership.
# Docker volume mounts (sessions/ agents/) cause the parent dir to be created
# as root if it doesn't exist in the image — making it unwritable by the node user.
# Pre-creating here (as root) with correct ownership fixes the EACCES crash loop.
RUN mkdir -p /home/node/.openclaw/workspace/skills \
             /home/node/.openclaw/sessions \
             /home/node/.openclaw/agents \
    && chown -R node:node /home/node/.openclaw

# Startup script
COPY openclaw/start.sh /start.sh
RUN chmod +x /start.sh

USER node

EXPOSE 18789

CMD ["/start.sh"]
