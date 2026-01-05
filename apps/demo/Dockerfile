# Use official Bun image (using latest stable version)
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js application
RUN bun run build

# Expose port
EXPOSE 3000

# Set default environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Health check (using curl which is available in Bun image)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start Next.js server
CMD ["bun", "run", "start"]

