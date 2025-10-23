# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for API URLs
ARG VITE_LLM_SERVICE_URL=/api/llm
ARG VITE_FILE_SERVICE_URL=/api/files

# Set environment variables from build args
ENV VITE_LLM_SERVICE_URL=$VITE_LLM_SERVICE_URL
ENV VITE_FILE_SERVICE_URL=$VITE_FILE_SERVICE_URL

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
