# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better cache)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Expose port
EXPOSE 3001

ENV NODE_ENV=development

# Start in dev mode by default
CMD ["npm", "run", "dev"]
