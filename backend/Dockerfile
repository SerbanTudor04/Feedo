# STAGE 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy manifests first
COPY package*.json ./

# Install ALL dependencies (including TypeScript)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Generate Prisma Client (crucial step for Prisma + Docker)
RUN npx prisma generate

# Build the TypeScript code (compiles .ts -> .js in /dist)
RUN npm run build

# STAGE 2: Run
FROM node:24-alpine

WORKDIR /app

# Copy manifest to install only production deps
COPY package*.json ./

# Install only production dependencies to keep image small
RUN npm ci --only=production

# Copy the built JS files from the builder stage
COPY --from=builder /app/dist ./dist
# Copy the prisma schema (needed for the client to work)
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Run the COMPILED javascript file
CMD ["node", "dist/index.js"]