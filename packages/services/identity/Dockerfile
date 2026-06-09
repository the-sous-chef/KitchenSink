FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/services/identity/dist ./dist
COPY packages/services/identity/package.json ./package-local.json

RUN npm ci --omit=dev

EXPOSE 3001
CMD ["node", "dist/main.js"]
