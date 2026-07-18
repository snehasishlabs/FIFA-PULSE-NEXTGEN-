#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "================================================================="
echo "  🚀 FIFA Pulse AI Terminal - Playwright E2E Runner"
echo "================================================================="

# Step 1: Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Node dependencies..."
  npm ci || npm install
fi

# Step 2: Install Playwright browsers (with dependencies if running in CI / Linux)
echo "🌐 Installing Playwright Chromium browser..."
npx playwright install --with-deps chromium

# Step 3: Spin up the development server in the background
echo "⚡ Starting dev server on Port 3000 in background..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Ensure the background server is terminated when the script exits
trap 'echo "🧹 Shutting down background server (PID: $SERVER_PID)..."; kill $SERVER_PID 2>/dev/null || true' EXIT

# Step 4: Wait for the port to be healthy (timeout in 60s)
echo "⏳ Waiting for Port 3000 to become active..."
TIMEOUT=60
count=0
while ! curl -s http://localhost:3000/api/auth/session >/dev/null; do
  sleep 1
  count=$((count+1))
  if [ $count -ge $TIMEOUT ]; then
    echo "❌ Error: Timeout waiting for server to start on port 3000."
    echo "📄 Showing server.log:"
    cat server.log
    exit 1
  fi
done

echo "✅ Server is active and healthy!"

# Step 5: Execute Playwright E2E tests
echo "🧪 Running Playwright E2E tests..."
npm run test:e2e

echo "================================================================="
echo "  🎉 E2E Tests Completed Successfully!"
echo "================================================================="
