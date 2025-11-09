#!/bin/bash

# Remote deployment script for moshe-makies.dev (129.159.130.84)
# This script deploys the Windows XP Portfolio to the production server using Kubernetes

set -e

# Configuration
SERVER_IP="${SERVER_IP:-129.159.130.84}"
SERVER_USER="${SERVER_USER:-ubuntu}"
DEPLOY_PATH="/opt/portfolio"
DOMAIN="moshe-makies.dev"
NAMESPACE="portfolio"

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
echo "☸️  Deployment method: Kubernetes"
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
    
    # Build Docker images
    echo "🔨 Building Docker images..."
    docker build -t portfolio-client:latest ./client
    docker build -t llm-service:latest ./services/llm-service
    docker build -t file-service:latest ./services/file-service
    
    # Deploy to Kubernetes
    echo "☸️  Deploying to Kubernetes..."
    
    # Create/update namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Apply ConfigMap
    kubectl apply -f k8s/configmap.yaml -n $NAMESPACE
    
    # Deploy services
    echo "  Deploying LLM service..."
    kubectl apply -f k8s/llm-service-deployment.yaml -n $NAMESPACE
    
    echo "  Deploying file service..."
    kubectl apply -f k8s/file-service-deployment.yaml -n $NAMESPACE
    
    echo "  Deploying client..."
    kubectl apply -f k8s/client-deployment.yaml -n $NAMESPACE
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/portfolio-client -n $NAMESPACE 2>/dev/null || true
    kubectl wait --for=condition=available --timeout=300s deployment/file-service -n $NAMESPACE 2>/dev/null || true
    
    # Check deployment status
    echo "🏥 Checking deployment status..."
    kubectl get pods -n $NAMESPACE
    echo ""
    kubectl get svc -n $NAMESPACE
    
    # Get access information
    NODE_PORT=\$(kubectl get svc client-service -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')
    
    # Cleanup
    echo ""
    echo "🧹 Cleaning up old Docker images..."
    docker image prune -af --filter "until=24h"
    
    echo ""
    echo "=========================================================="
    echo "✅ Deployment completed successfully!"
    echo "=========================================================="
    echo ""
    echo "🌐 Application URL: http://$DOMAIN:\$NODE_PORT"
    echo "🌐 Direct IP: http://$SERVER_IP:\$NODE_PORT"
    echo ""
    echo "Useful commands:"
    echo "  View pods:    kubectl get pods -n $NAMESPACE"
    echo "  View logs:    kubectl logs -f deployment/portfolio-client -n $NAMESPACE"
    echo "  Scale:        kubectl scale deployment/portfolio-client --replicas=3 -n $NAMESPACE"
    echo "  Restart:      kubectl rollout restart deployment/portfolio-client -n $NAMESPACE"
    echo ""
ENDSSH

echo ""
echo "✅ Remote deployment completed!"
echo "🌐 Visit: http://$DOMAIN"
echo ""
