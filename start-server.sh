#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
while true; do
    echo "Starting server at $(date)"
    node .next/standalone/server.js 2>&1
    echo "Server exited with code $?, restarting in 2s..."
    sleep 2
done
