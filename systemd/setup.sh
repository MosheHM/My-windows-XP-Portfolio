#!/bin/bash

# Portfolio Systemd Setup Script
# This script sets up the portfolio application with systemd service management

set -e

echo "=== Portfolio Systemd Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Repository root: $REPO_ROOT"
echo ""

# Step 1: Create Docker network
echo "Step 1: Creating Docker network..."
if ! docker network ls | grep -q portfolio-network; then
    docker network create portfolio-network
    echo "✓ Created portfolio-network"
else
    echo "✓ Network already exists"
fi
echo ""

# Step 2: Build Docker images
echo "Step 2: Building Docker images with Alpine Linux..."
echo "Building client..."
cd "$REPO_ROOT/client"
docker build -t portfolio-client:latest .

echo "Building file-service..."
cd "$REPO_ROOT/services/file-service"
docker build -t portfolio-file-service:latest .

echo "Building llm-service..."
cd "$REPO_ROOT/services/llm-service"
docker build -t portfolio-llm-service:latest .

echo "Building nginx..."
cd "$REPO_ROOT/nginx"
docker build -t portfolio-nginx:latest .

echo "✓ All images built successfully"
echo ""

# Step 3: Install systemd service files
echo "Step 3: Installing systemd service files..."
cp "$SCRIPT_DIR"/*.service /etc/systemd/system/
echo "✓ Service files copied to /etc/systemd/system/"
echo ""

# Step 4: Reload systemd
echo "Step 4: Reloading systemd daemon..."
systemctl daemon-reload
echo "✓ Systemd daemon reloaded"
echo ""

# Step 5: Enable services
echo "Step 5: Enabling services to start on boot..."
systemctl enable portfolio-client.service
systemctl enable portfolio-file-service.service
systemctl enable portfolio-llm-service.service
systemctl enable portfolio-nginx.service
echo "✓ Services enabled"
echo ""

# Step 6: Start services
echo "Step 6: Starting services..."
systemctl start portfolio-client
systemctl start portfolio-file-service
systemctl start portfolio-llm-service
systemctl start portfolio-nginx
echo "✓ Services started"
echo ""

# Step 7: Check status
echo "Step 7: Checking service status..."
echo ""
echo "--- Portfolio Client ---"
systemctl status portfolio-client --no-pager -l
echo ""
echo "--- Portfolio File Service ---"
systemctl status portfolio-file-service --no-pager -l
echo ""
echo "--- Portfolio LLM Service ---"
systemctl status portfolio-llm-service --no-pager -l
echo ""
echo "--- Portfolio Nginx ---"
systemctl status portfolio-nginx --no-pager -l
echo ""

echo "=== Setup Complete ==="
echo ""
echo "Your portfolio application is now running with systemd!"
echo ""
echo "Useful commands:"
echo "  View all services:     systemctl status portfolio-*"
echo "  View logs:             journalctl -u portfolio-<service> -f"
echo "  Restart a service:     systemctl restart portfolio-<service>"
echo "  Stop all services:     systemctl stop portfolio-*"
echo ""
echo "Application should be available at: http://localhost"
