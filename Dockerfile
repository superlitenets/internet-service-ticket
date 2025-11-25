FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . /app

# Generate Prisma client
RUN pnpm prisma generate

# Expose ports
EXPOSE 9000 5173

# Default command (can be overridden)
CMD ["npm", "run", "dev"]
