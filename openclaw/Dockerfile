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

# Startup script
COPY openclaw/start.sh /start.sh
RUN chmod +x /start.sh

USER node

EXPOSE 18789

CMD ["/start.sh"]
