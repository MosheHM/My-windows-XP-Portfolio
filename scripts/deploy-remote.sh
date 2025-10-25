#!/bin/bash

# Remote deployment script for moshe-makies.dev (129.159.130.84)
# This script deploys the Windows XP Portfolio to the production server

set -e

# Configuration
SERVER_IP="${SERVER_IP:-129.159.130.84}"
SERVER_USER="${SERVER_USER:-ubuntu}"
DEPLOY_PATH="/opt/portfolio"
DOMAIN="moshe-makies.dev"

echo "🚀 Deploying Windows XP Portfolio to $DOMAIN"
echo "=========================================================="
echo ""

# Check if SSH_PRIVATE_KEY_PATH is set for manual deployment
if [ -z "$SSH_PRIVATE_KEY_PATH" ]; then
    echo "⚠️  Using default SSH key (~/.ssh/id_rsa)"
    SSH_KEY_PATH="$HOME/.ssh/id_rsa"
else
    SSH_KEY_PATH="$SSH_PRIVATE_KEY_PATH"
fi

# Verify SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at: $SSH_KEY_PATH"
    echo "Please set SSH_PRIVATE_KEY_PATH environment variable or ensure key exists"
    exit 1
fi

echo "✅ SSH key found"
echo "📡 Server: $SERVER_USER@$SERVER_IP"
echo "📁 Deploy path: $DEPLOY_PATH"
echo ""

# Deploy to server
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << ENDSSH
    set -e
    
    echo "📦 Preparing deployment on server..."
    
    # Create deploy directory if it doesn't exist
    sudo mkdir -p $DEPLOY_PATH
    sudo chown -R $USER:$USER $DEPLOY_PATH
    
    # Navigate to project directory or clone if doesn't exist
    if [ -d "$DEPLOY_PATH/.git" ]; then
        cd $DEPLOY_PATH
        echo "🔄 Pulling latest changes..."
        git fetch origin
        git reset --hard origin/main
    else
        echo "📥 Cloning repository..."
        git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git $DEPLOY_PATH
        cd $DEPLOY_PATH
    fi
    
    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Pull and rebuild images
    echo "🔨 Building Docker images..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    echo "▶️  Starting services..."
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 15
    
    # Check health
    echo "🏥 Checking service health..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ All services are healthy!"
    else
        echo "⚠️  Health check failed. Checking logs..."
        docker compose -f $DEPLOY_PATH/docker-compose.prod.yml ps
    fi
    
    # Cleanup
    echo "🧹 Cleaning up old Docker images..."
    docker image prune -af --filter "until=24h"
    
    echo ""
    echo "=========================================================="
    echo "✅ Deployment completed successfully!"
    echo "=========================================================="
    echo ""
    echo "🌐 Application URL: http://$DOMAIN"
    echo "🌐 Direct IP: http://$SERVER_IP"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker compose -f $DEPLOY_PATH/docker-compose.prod.yml logs -f"
    echo "  Stop:         docker compose -f $DEPLOY_PATH/docker-compose.prod.yml down"
    echo "  Restart:      docker compose -f $DEPLOY_PATH/docker-compose.prod.yml restart"
    echo ""
ENDSSH

echo ""
echo "✅ Remote deployment completed!"
echo "🌐 Visit: http://$DOMAIN"
echo ""
