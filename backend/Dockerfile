FROM node:18-alpine

# Install curl for health check mandatory verification
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies first to leverage Docker layer caching
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose the backend port matching your .env
EXPOSE 5000

# Optional: Add explicit Docker health monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the server
CMD ["npm", "start"]