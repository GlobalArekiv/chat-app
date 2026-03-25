#!/bin/bash
# Friendship Call - Quick Start Script
# Handles building and running the application with SFU topology

set -e

echo "🚀 VidyaX - Starting in SFU Mode"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21+ first."
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ Go $(go version)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Build frontend
echo "🔨 Building frontend assets..."
npm run build

# Run server with SFU enabled
echo ""
echo "🎬 Starting Friendship Call server (SFU mode)..."
echo "📍 Server running at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

export PEERCALLS_FS=.
export PEERCALLS_NETWORK_TYPE=sfu
go run main.go
