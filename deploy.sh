#!/usr/bin/env bash
# ========================================================
# DeKUTSO Comrade Choice Awards - Production Deploy Script
# Run this on your VPS to deploy or update the platform
# Usage: ./deploy.sh
# ========================================================

set -e

echo "🚀 [1/5] Pulling latest code from GitHub..."
git pull origin main

echo "📦 [2/5] Installing server dependencies..."
cd server
npm install --omit=dev
cd ..

echo "🎨 [3/5] Building React client frontend..."
cd client
npm install
npm run build
cd ..

echo "⚡ [4/5] Reloading backend with PM2..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
    pm2 save
else
    echo "⚠️ PM2 not found. Install globally with: sudo npm install -g pm2"
fi

echo "🔄 [5/5] Reloading Nginx..."
if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "✅ Deployment completed successfully!"
