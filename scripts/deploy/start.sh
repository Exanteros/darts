#!/bin/sh
set -e

# Run migrations using local binary (npx would try to fetch from npm → fails in read-only container)
./node_modules/.bin/prisma migrate deploy

# Start WebSocket Server in background
node websocket-game-server.js &
npx tsx scripts/mail-listener.ts &

# Start Next.js Server
exec node server.js
