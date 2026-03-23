FROM ghcr.io/openclaw/openclaw:main-amd64

USER root

# Copy openclaw config (model provider, channels, agent system prompt)
COPY openclaw/openclaw.json /home/node/.openclaw/openclaw.json

# Copy CEO assistant skill into OpenClaw workspace
RUN mkdir -p /home/node/.openclaw/workspace/skills/ceo-assistant
COPY skills/ceo-assistant/SKILL.md /home/node/.openclaw/workspace/skills/ceo-assistant/SKILL.md

RUN chown -R node:node /home/node/.openclaw

USER node

EXPOSE 18789

# --bind lan: expose gateway on container LAN (not just loopback), required for inter-container access
# --allow-unconfigured: allow startup without interactive onboarding wizard
CMD ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "18789", "--allow-unconfigured"]
