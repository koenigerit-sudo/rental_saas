FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.base.json ./
COPY apps/worker ./apps/worker
RUN npm run -w @rental/worker build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/worker/dist ./dist
CMD ["node", "dist/worker.js"]
