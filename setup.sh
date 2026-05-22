#!/bin/bash
set -e

echo "🚀 Setting up Nexus Chat..."

# Install root deps (concurrently)
echo "📦 Installing root dependencies..."
npm install

# Install server deps
echo "📦 Installing server dependencies..."
cd server && npm install

# Setup database
echo "🗄️  Initializing database..."
npx prisma db push
node prisma/seed.js

cd ..

# Install client deps
echo "📦 Installing client dependencies..."
cd client && npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start Nexus, run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:5173"
