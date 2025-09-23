# Multi-stage build for production and development
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
# Install all dependencies (including dev dependencies)
RUN npm ci
# Copy source code
COPY . .
# Expose port
EXPOSE 4000
# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=4000
ENV DATA_BACKEND=mock
# Default command for development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
# Install only production dependencies
RUN npm ci --only=production
# Copy source code
COPY . .
# Build the application
RUN npm run build
# Expose port
EXPOSE 4000
# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_BACKEND=mock
# Start the application
CMD ["npm", "run", "start:prod"]
