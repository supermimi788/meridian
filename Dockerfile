FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first (better layer cache).
# Prefer lockfile install, but fall back when lockfile is out-of-sync.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
CMD ["npm", "start"]
