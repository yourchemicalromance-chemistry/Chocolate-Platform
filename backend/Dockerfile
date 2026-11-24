FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS production-deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm pkg delete devDependencies && npm ci --omit=dev --omit=peer

FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=production-deps --chown=node:node /app/package.json ./package.json
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/ca.pem ./ca.pem

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
