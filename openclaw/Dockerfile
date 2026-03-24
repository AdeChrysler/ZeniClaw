FROM ghcr.io/openclaw/openclaw:main

USER root

# Copy CEO assistant skill into OpenClaw workspace
RUN mkdir -p /app/skills/ceo-assistant
COPY skills/ceo-assistant/SKILL.md /app/skills/ceo-assistant/SKILL.md

USER node

EXPOSE 18789

# Test: use base image default CMD (loopback only) to confirm basic startup works
# --allow-unconfigured: allow startup without interactive wizard
CMD ["node", "openclaw.mjs", "gateway", "--allow-unconfigured"]
