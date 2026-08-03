# syntax=docker/dockerfile:1

# --- Dépendances complètes (dev incluses) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# --- Stage TEST : Vitest + ESLint + TypeScript + build Next.js.
# Toutes les vérifications qualité tournent dans un conteneur.
FROM node:22-alpine AS test
WORKDIR /app
ENV CI=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-lc", "npm test -- --run && npm run lint && npx tsc --noEmit && npm run build"]

# --- Build de production ---
FROM node:22-alpine AS build
WORKDIR /app
ARG BACKEND_URL=http://localhost:8080
ENV BACKEND_URL=${BACKEND_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runtime minimal ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.* ./
EXPOSE 3000
CMD ["npm", "start"]
