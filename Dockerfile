FROM node:18-alpine AS base

# Install required Alpine packages and pnpm in a single layer
RUN apk add --no-cache bash libc6-compat netcat-openbsd && \
    npm install -g pnpm && \
    npm cache clean --force

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm build

# Production image - use a minimal approach
FROM node:18-alpine AS runner
WORKDIR /app

# Install only what we need for production
RUN apk add --no-cache netcat-openbsd && \
    npm install -g pnpm && \
    npm cache clean --force

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed for migrations
COPY package.json pnpm-lock.yaml* ./
COPY --from=deps /app/node_modules ./node_modules

# Copy database directory (contains migrations & other SQL files)
COPY --from=builder /app/db ./db

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]