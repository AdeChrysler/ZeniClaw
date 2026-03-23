FROM ghcr.io/openclaw/openclaw:main

USER root

# Copy openclaw config into the image (not mounted as volume, stays in image layer)
COPY openclaw/openclaw.json /home/node/.openclaw/openclaw.json

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
