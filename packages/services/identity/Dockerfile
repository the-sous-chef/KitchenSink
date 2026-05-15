FROM node:24-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json nest-cli.json ./
COPY src ./src

RUN npm ci
RUN npm run build

FROM node:24-slim AS runtime

WORKDIR /app

COPY package.json package-lock.json* ./
COPY --from=builder /app/dist ./dist

RUN npm ci --omit=dev

EXPOSE 3001

CMD ["node", "dist/main.js"]
