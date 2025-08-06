#!/bin/sh

# Initialize database
echo "Initializing database..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting application..."
npm start 