#!/bin/sh
set -e

if [ ! -w /app/public/uploads ]; then
    echo "ERROR: /app/public/uploads is not writable."
    echo "On the host, run: mkdir -p ./public/uploads && chmod 755 ./public/uploads"
    exit 1
fi

echo "Running database migrations..."
prisma migrate deploy

echo "Starting application..."
exec node server.js
