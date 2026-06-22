#!/bin/sh

echo "Running migrations..."
bun run drizzle-kit push

echo "Starting server..."
bun run src/index.ts
