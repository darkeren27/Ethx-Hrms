# ==========================================
# Multi-stage Dockerfile for ETHX HRMS
# ==========================================

# Stage 1: Build the React TypeScript application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy source code and configuration
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with lightweight high-performance Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built bundle from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with ERPNext reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose internal port 80
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
