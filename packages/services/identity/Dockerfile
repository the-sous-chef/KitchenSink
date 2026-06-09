FROM node:24-slim AS builder

WORKDIR /app

# Copy workspace root configs needed for npm workspaces
COPY package.json package-lock.json* ./
COPY packages/services/identity/package.json ./packages/services/identity/package.json
COPY packages/tools/typescript/package.json ./packages/tools/typescript/package.json
COPY packages/tools/eslint/package.json ./packages/tools/eslint/package.json
COPY packages/shared/config/package.json ./packages/shared/config/package.json 2>/dev/null || true

RUN npm ci --omit=dev

COPY tsconfig.json nest-cli.json ./
COPY packages/tools/typescript/tsconfig.json ./packages/tools/typescript/tsconfig.json 2>/dev/null || true
COPY packages/shared/config/ ./packages/shared/config/ 2>/dev/null || true
COPY packages/services/identity/tsconfig.json ./packages/services/identity/tsconfig.json
COPY packages/services/identity/nest-cli.json ./packages/services/identity/nest-cli.json 2>/dev/null || true
COPY packages/services/identity/src ./packages/services/identity/src

WORKDIR /app/packages/services/identity
RUN npx nest build

FROM node:24-slim AS runtime

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/services/identity/package.json ./packages/services/identity/package.json
COPY --from=builder /app/packages/services/identity/dist ./packages/services/identity/dist

RUN npm ci --omit=dev --workspace=false 2>/dev/null || true

EXPOSE 3001
WORKDIR /app/packages/services/identity
CMD ["node", "dist/main.js"]
