FROM node:24-slim

WORKDIR /app

COPY node_modules ./node_modules
COPY packages/services/identity/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
