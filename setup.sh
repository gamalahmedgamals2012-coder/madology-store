#!/bin/bash

# MADOLOGY - Quick Setup Script for macOS/Linux

echo ""
echo "========================================"
echo "  MADOLOGY - E-Commerce Store"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js is installed:"
node --version
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "========================================"
echo "  How to run the server:"
echo "========================================"
echo ""
echo "Option 1: Simple Server (NO DATABASE REQUIRED - RECOMMENDED)"
echo "  Command: node server-simple.js"
echo ""
echo "Option 2: Full Server with MongoDB"
echo "  Command: node index.js"
echo "  (Requires MongoDB running on localhost:27017)"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "========================================"
echo ""
