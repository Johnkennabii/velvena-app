# =============================================================================
# Velvena App - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Stage 1: Build the React application
# Stage 2: Serve with Nginx
# =============================================================================

# Stage 1: Build
FROM node:23.11.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application with production environment
ARG VITE_API_URL=https://api.velvena.fr
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=Velvena
ENV VITE_APP_ENVIRONMENT=production

RUN npm run build

# Stage 2: Production - Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health.html || exit 1

# Create health check file
RUN echo "OK" > /usr/share/nginx/html/health.html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
