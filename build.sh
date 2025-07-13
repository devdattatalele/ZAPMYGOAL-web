#!/bin/bash

# Force npm to use legacy peer deps
echo "Setting up npm configuration..."
npm config set legacy-peer-deps true
npm config set force true

# Install dependencies with force
echo "Installing dependencies..."
npm install --force

# Build the project
echo "Building project..."
npm run build

# Verify dist directory was created
if [ -d "dist" ]; then
    echo "Build completed successfully! dist directory created."
    ls -la dist/
else
    echo "Error: dist directory was not created."
    exit 1
fi 