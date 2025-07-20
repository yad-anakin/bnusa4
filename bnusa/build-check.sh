#!/bin/bash

# Script to check if the Next.js build works properly

echo "Starting build check for Bnusa frontend..."

# Install dependencies
echo "Installing dependencies..."
npm ci || { echo "Failed to install dependencies"; exit 1; }

# Run build
echo "Building the application..."
npm run build || { echo "Build failed"; exit 1; }

echo "Build completed successfully!"
echo "The application is ready to be deployed with Coolify."

# Optional: Run a quick test of the build
echo "You can test the production build locally with: npm start"

exit 0 