#!/usr/bin/env bash
# Quick start script for NusaTrade

cd "C:\Users\Awir\Documents\KULIAH\TA-BigData\StockWeb"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          NusaTrade - Quick Start Server               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if MongoDB is running
echo "[1/3] Checking MongoDB connection..."
timeout 3 mongosh --eval "db.version()" &>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ MongoDB is running"
else
  echo "✗ MongoDB not found. Please start MongoDB first!"
  echo "  Run: mongod"
  exit 1
fi

# Check Node.js
echo "[2/3] Checking Node.js..."
if command -v node &> /dev/null; then
  echo "✓ Node.js $(node -v) found"
else
  echo "✗ Node.js not found"
  exit 1
fi

# Seed database (optional)
echo "[3/3] Starting server..."
echo ""
echo "╔════════════════════════════════════════════════════════╗"
npm run dev
