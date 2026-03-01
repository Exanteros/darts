#!/bin/sh
set -e

# Run migrations using local binary (npx would try to fetch from npm → fails in read-only container)
./node_modules/.bin/prisma migrate deploy

# Start WebSocket Server in background
node websocket-game-server.js &

# Start Next.js Server
exec node server.js
