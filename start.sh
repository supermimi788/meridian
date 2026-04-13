#!/bin/bash
echo "Starting auto-learn-evolve in background..."
node auto-learn-evolve.js &

echo "Starting Meridian main bot..."
node index.js
