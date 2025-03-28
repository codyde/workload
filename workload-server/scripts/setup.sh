#!/bin/bash

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "Setting up Workload Server..."

# Generate database migrations
echo "Generating database migrations..."
bun run db:generate

# Run migrations
echo "Applying migrations..."
bun run db:push

# Start the server
echo "Starting the server..."
bun run dev 