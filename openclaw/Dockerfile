FROM ghcr.io/openclaw/openclaw:main-slim-amd64

USER root

# Copy openclaw config (model provider, channels, agent system prompt)
COPY openclaw/openclaw.json /home/node/.openclaw/openclaw.json

# Copy CEO assistant skill into OpenClaw workspace
RUN mkdir -p /home/node/.openclaw/workspace/skills/ceo-assistant
COPY skills/ceo-assistant/SKILL.md /home/node/.openclaw/workspace/skills/ceo-assistant/SKILL.md

RUN chown -R node:node /home/node/.openclaw

USER node

EXPOSE 18789

# --bind lan: required for container-to-container networking (default is loopback only)
# --allow-unconfigured: start gateway without requiring prior interactive onboarding
CMD ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "18789", "--allow-unconfigured"]
