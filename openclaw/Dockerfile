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

# gateway.mode=local and gateway.bind=lan are set in openclaw.json config
# OPENCLAW_GATEWAY_TOKEN env var provides auth token for LAN binding
CMD ["node", "openclaw.mjs", "gateway", "--port", "18789"]
