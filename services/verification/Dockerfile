# Multi-stage build for ProofGraph Verification Service

# Stage 1: Build shared library
FROM node:18-alpine AS shared-builder

WORKDIR /app/shared

# Copy shared package files
COPY ../shared/package*.json ./
COPY ../shared/tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy shared source code
COPY ../shared/src ./src

# Build shared library
RUN npm run build

# Stage 2: Build verification service
FROM node:18-alpine AS builder

WORKDIR /app

# Copy verification service package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy shared library from previous stage
COPY --from=shared-builder /app/shared/dist ./node_modules/@proofgraph/shared/dist
COPY --from=shared-builder /app/shared/package.json ./node_modules/@proofgraph/shared/

# Copy verification service source code
COPY src ./src

# Build the application
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S verification -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy shared library
COPY --from=shared-builder /app/shared/dist ./node_modules/@proofgraph/shared/dist
COPY --from=shared-builder /app/shared/package.json ./node_modules/@proofgraph/shared/

# Create logs directory
RUN mkdir -p logs && chown -R verification:nodejs logs

# Switch to non-root user
USER verification

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/app.js"]
