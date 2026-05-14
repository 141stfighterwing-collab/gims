#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
while true; do
    node .next/standalone/server.js 2>&1
    echo "[$(date)] Server exited, restarting..." >> /home/z/my-project/restart.log
    sleep 1
done
