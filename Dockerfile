# ===========================================
# DOCKERFILE FOR REWARDBOOK APPLICATION
# Multi-stage build for optimized production image
# ===========================================

# -------------------------------------------
# STAGE 1: Dependencies
# Purpose: Install all dependencies in an isolated layer
# This layer is cached and only rebuilds when package.json changes
# -------------------------------------------
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies based on available lock file
# This follows the Dependency Inversion Principle - we don't hardcode
# a specific package manager, instead we detect and adapt
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# -------------------------------------------
# STAGE 2: Builder
# Purpose: Build the production application
# Compiles TypeScript, bundles assets, optimizes for production
# -------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Set environment variables for build
# NEXT_TELEMETRY_DISABLED: Disables Next.js telemetry for privacy
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
# This creates an optimized production build in .next folder
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then \
    yarn build; \
  else \
    npm run build; \
  fi

# -------------------------------------------
# STAGE 3: Runner (Production)
# Purpose: Minimal production image
# Single Responsibility: Only runs the application
# -------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
# Following security best practices - containers shouldn't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from builder stage
# This keeps the image small and follows Interface Segregation -
# only include what's needed for runtime

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js standalone build output
# The standalone output includes only the necessary server files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Set the port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check to verify container is running properly
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
# Using node directly for better signal handling in containers
CMD ["node", "server.js"]
