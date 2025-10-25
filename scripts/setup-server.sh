#!/bin/bash

# Server Setup Script for moshe-makies.dev (129.159.130.84)
# Run this script on your production server to prepare it for deployment

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

# Install Docker Compose plugin if not installed
if ! docker compose version &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo apt install docker-compose-plugin -y
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
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
    sudo ufw status
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not found, skipping firewall configuration"
fi

# Install Certbot for SSL (optional)
read -p "Do you want to install Certbot for SSL certificates? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔒 Installing Certbot..."
    sudo apt install certbot python3-certbot-nginx -y
    echo "✅ Certbot installed"
    echo ""
    echo "To get an SSL certificate, run:"
    echo "  sudo certbot certonly --standalone -d moshe-makies.dev"
    echo ""
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
echo "Docker Compose version: $(docker compose version)"
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
