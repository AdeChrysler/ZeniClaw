FROM ghcr.io/openclaw/openclaw:main

USER root

# Copy CEO assistant skill into OpenClaw workspace (at /app/skills where OpenClaw looks)
RUN mkdir -p /app/skills/ceo-assistant
COPY skills/ceo-assistant/SKILL.md /app/skills/ceo-assistant/SKILL.md

USER node

EXPOSE 18789

# Use the same CMD as the base image but add --bind lan for inter-container access
# --bind lan: expose on Docker bridge network (0.0.0.0), required for other containers to reach us
# --allow-unconfigured: allow startup without interactive wizard
CMD ["node", "/app/openclaw.mjs", "gateway", "--bind", "lan", "--port", "18789", "--allow-unconfigured"]
