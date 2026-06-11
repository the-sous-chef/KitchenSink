FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY node_modules ./node_modules
COPY packages/services/identity/node_modules ./packages/services/identity/node_modules
COPY packages/services/identity/prod.package.json ./packages/services/identity/package.json
COPY packages/services/identity/dist ./packages/services/identity/dist

EXPOSE 3000
CMD ["node", "packages/services/identity/dist/src/main.js"]
