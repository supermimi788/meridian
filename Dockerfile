FROM node:20-bookworm-slim

WORKDIR /app

# Copy files needed for dependency install (including postinstall script path)
COPY package.json package-lock.json ./
COPY scripts ./scripts

# Prefer lockfile install, but fall back when lockfile is out-of-sync.
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
CMD ["npm", "start"]
