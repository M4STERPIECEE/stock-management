FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable \
 && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json ./

RUN pnpm install --frozen-lockfile

COPY src ./src
COPY templates ./templates

RUN pnpm run build

FROM node:22-alpine

WORKDIR /app

RUN corepack enable \
 && corepack prepare pnpm@10.14.0 --activate

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates

EXPOSE 3000

CMD ["node", "dist/main"]