# Multi-stage build for optimal production image size

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm@10.14.0 && \
    pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache dumb-init

# Copy package files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm@10.14.0 && \
    pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9000/api/ping', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server/node-build.mjs"]
