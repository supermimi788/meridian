FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first (better layer cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
CMD ["npm", "start"]
