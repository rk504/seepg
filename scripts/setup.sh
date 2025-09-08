#!/bin/bash

# Promo Code Intelligence Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Promo Code Intelligence MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Supabase CLI is available (optional)
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. You can install it with:"
    echo "   npm install -g supabase"
    echo "   Or use the web dashboard at supabase.com"
else
    echo "✅ Supabase CLI detected"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env with your database credentials"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Check if database is accessible
echo "🔍 Checking database connection..."
if npm run db:push > /dev/null 2>&1; then
    echo "✅ Database connection successful"
    
    # Seed database
    echo "🌱 Seeding database with sample data..."
    npm run db:seed
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start the development server: npm run dev"
    echo "2. Open http://localhost:3000 in your browser"
    echo "3. Explore the dashboard with sample data"
    echo ""
    echo "Useful commands:"
    echo "  npm run dev          - Start development server"
    echo "  npm run test         - Run tests"
    echo "  npm run db:studio    - Open Prisma Studio"
    echo "  npm run db:reset     - Reset and reseed database"
    echo ""
else
    echo "❌ Database connection failed"
    echo "Please check your Supabase credentials in .env file"
    echo "1. Create a project at supabase.com"
    echo "2. Get your DATABASE_URL from Settings > Database"
    echo "3. Get your SUPABASE_URL and SUPABASE_ANON_KEY from Settings > API"
    echo "Example DATABASE_URL: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
    exit 1
fi
