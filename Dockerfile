# Use Node.js LTS as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json .npmrc ./

# Install dependencies with legacy peer deps to handle compatibility issues
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the Next.js application with linting disabled
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 