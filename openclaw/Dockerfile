FROM ghcr.io/openclaw/openclaw:main

USER root

# Copy openclaw config (gateway settings, model, channels)
COPY openclaw/openclaw.json /home/node/.openclaw/openclaw.json

# Copy skills into image's native skills directory
RUN mkdir -p /app/skills
COPY skills/ /app/skills/

RUN chown -R node:node /home/node/.openclaw /app/skills

USER node

EXPOSE 18789

# Use official image mechanism: node openclaw.mjs gateway
# --bind lan: required for container-to-container networking (default is loopback)
# --allow-unconfigured: official CMD flag, allows start without prior onboarding
CMD ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "18789", "--allow-unconfigured"]
