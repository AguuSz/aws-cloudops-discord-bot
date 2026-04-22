FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install all dependencies (need tsx for seed at runtime)
COPY package*.json ./
RUN npm ci --build-from-source

# Copy source and build
COPY . .
RUN npx tsc

CMD ["node", "dist/index.js"]
