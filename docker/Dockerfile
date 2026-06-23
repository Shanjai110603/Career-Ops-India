FROM node:20-alpine AS base
RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/ai/package.json packages/ai/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/locations/package.json packages/locations/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build:web

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_PATH=/app/data/career-ops.db

VOLUME /app/data

CMD ["node", "apps/web/server/index.js"]
