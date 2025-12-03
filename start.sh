#!/bin/sh
# Start WebSocket Server in background
node websocket-game-server.js &

# Start Next.js Server
node server.js
