#!/bin/bash

# Create the PostgreSQL database if it doesn't exist
echo "Creating database if it doesn't exist..."
psql -c "SELECT 1 FROM pg_database WHERE datname = 'workload'" | grep -q 1 || psql -c "CREATE DATABASE workload"

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

echo "Database setup complete!"
