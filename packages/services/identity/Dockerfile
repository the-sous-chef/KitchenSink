FROM node:24-slim

WORKDIR /app

COPY packages/services/identity/dist ./dist
COPY packages/services/identity/package.json ./

RUN npm install --omit=dev

EXPOSE 3001
CMD ["node", "dist/main.js"]
