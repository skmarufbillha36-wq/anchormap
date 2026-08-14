#!/bin/sh
set -e

echo ""
echo "🗺️  ================================="
echo "   AnchorMap GIS API"
echo "================================= 🗺️"
echo ""
echo "⏳ Running database migrations..."

npx prisma migrate deploy \
  --schema=/app/packages/database/prisma/schema.prisma

echo "✅ Migrations applied!"
echo "🚀 Starting server on port ${PORT:-5000}..."
echo ""

exec node server.js
