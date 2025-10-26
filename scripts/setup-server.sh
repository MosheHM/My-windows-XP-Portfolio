#!/bin/bash

# Server Setup Script for moshe-makies.dev (129.159.130.84)
# Run this script on your production server to prepare it for Kubernetes deployment

set -e

echo "🔧 Setting up production server for Windows XP Portfolio"
echo "=========================================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Please do not run this script as root"
    echo "Run as a regular user with sudo privileges"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    echo "📥 Installing Git..."
    sudo apt install git -y
    echo "✅ Git installed"
else
    echo "✅ Git already installed"
fi

# Install curl if not installed
if ! command -v curl &> /dev/null; then
    echo "📥 Installing curl..."
    sudo apt install curl -y
    echo "✅ curl installed"
else
    echo "✅ curl already installed"
fi

# Install kubectl if not installed
if ! command -v kubectl &> /dev/null; then
    echo "☸️  Installing kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    echo "✅ kubectl installed"
else
    echo "✅ kubectl already installed"
fi

# Install k3s (lightweight Kubernetes) if not installed
if ! command -v k3s &> /dev/null; then
    echo "☸️  Installing k3s (Lightweight Kubernetes)..."
    curl -sfL https://get.k3s.io | sh -
    
    # Setup kubeconfig for non-root user
    mkdir -p $HOME/.kube
    sudo cp /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
    sudo chown $USER:$USER $HOME/.kube/config
    
    echo "✅ k3s installed"
else
    echo "✅ k3s already installed"
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
sudo mkdir -p /opt/portfolio
sudo chown -R $USER:$USER /opt/portfolio
echo "✅ Deployment directory created: /opt/portfolio"

# Configure firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    sudo ufw allow 6443/tcp comment 'Kubernetes API'
    sudo ufw allow 30000:32767/tcp comment 'Kubernetes NodePort'
    sudo ufw status
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not found, skipping firewall configuration"
fi

# Display server information
echo ""
echo "=========================================================="
echo "✅ Server setup completed!"
echo "=========================================================="
echo ""
echo "Server Information:"
echo "-------------------"
echo "Hostname: $(hostname)"
echo "IP Address: $(hostname -I | awk '{print $1}')"
echo "Docker version: $(docker --version)"
echo "kubectl version: $(kubectl version --client --short 2>/dev/null || echo 'N/A')"
echo "k3s status: $(sudo systemctl is-active k3s 2>/dev/null || echo 'Not running')"
echo "Git version: $(git --version)"
echo "Deployment directory: /opt/portfolio"
echo ""
echo "Next Steps:"
echo "1. Add your SSH public key to ~/.ssh/authorized_keys"
echo "2. Configure GitHub secrets with your SSH private key"
echo "3. Ensure domain moshe-makies.dev points to this server"
echo "4. Push to main branch to trigger auto-deployment"
echo ""
echo "⚠️  IMPORTANT: You may need to log out and log back in for"
echo "    Docker group changes to take effect"
echo ""
