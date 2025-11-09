#!/bin/bash

# Ubuntu/Debian Prerequisites Installation Script
# This script automates the installation steps from docs/DEPLOYMENT_PREREQS.md
# Tested on Ubuntu 20.04+
#
# Usage: ./ubuntu-prereqs-install.sh [options]
# Options:
#   --deploy-user <username>  Specify the deploy user (default: current user)
#   --skip-k3s                Skip k3s installation
#   --help                    Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOY_USER="${USER}"
SKIP_K3S=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --deploy-user)
            DEPLOY_USER="$2"
            shift 2
            ;;
        --skip-k3s)
            SKIP_K3S=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --deploy-user <username>  Specify the deploy user (default: current user)"
            echo "  --skip-k3s                Skip k3s installation"
            echo "  --help                    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Ubuntu/Debian Deployment Prerequisites Installation Script   ║${NC}"
echo -e "${BLUE}║  For moshe-makies.dev deployment environment                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Deploy user: ${DEPLOY_USER}${NC}"
echo -e "${YELLOW}Skip k3s: ${SKIP_K3S}${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}⚠️  Please do not run this script as root${NC}"
    echo "Run as a regular user with sudo privileges"
    exit 1
fi

# Check if user has sudo privileges
if ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}⚠️  This script requires sudo privileges${NC}"
    echo "Please enter your password when prompted"
    sudo -v
fi

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Update packages
print_section "1. Updating system packages"
sudo apt-get update
echo -e "${GREEN}✓ System packages updated${NC}"

# Step 2: Install git, curl, and prerequisite packages
print_section "2. Installing git, curl, and prerequisite packages"
sudo apt-get install -y git curl apt-transport-https ca-certificates software-properties-common gnupg lsb-release
echo -e "${GREEN}✓ Prerequisite packages installed${NC}"

# Step 3: Install Docker
print_section "3. Installing Docker"
if command_exists docker; then
    echo -e "${YELLOW}Docker is already installed${NC}"
    docker --version
else
    echo "Adding Docker's official GPG key..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "Setting up Docker repository..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    echo "Installing Docker Engine..."
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
    docker --version
fi

# Step 4: Start and enable Docker
print_section "4. Enabling and starting Docker service"
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker is running
if sudo systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker service is running${NC}"
else
    echo -e "${RED}✗ Docker service failed to start${NC}"
    exit 1
fi

# Step 5: Add deploy user to docker group
print_section "5. Adding user to docker group"
if groups "${DEPLOY_USER}" | grep -q '\bdocker\b'; then
    echo -e "${YELLOW}User ${DEPLOY_USER} is already in docker group${NC}"
else
    sudo usermod -aG docker "${DEPLOY_USER}"
    echo -e "${GREEN}✓ User ${DEPLOY_USER} added to docker group${NC}"
    echo -e "${YELLOW}⚠️  You need to log out and log back in for group membership to take effect${NC}"
    echo -e "${YELLOW}    Or run: newgrp docker${NC}"
fi

# Step 6: Install kubectl
print_section "6. Installing kubectl"
if command_exists kubectl; then
    echo -e "${YELLOW}kubectl is already installed${NC}"
    kubectl version --client
else
    echo "Downloading kubectl..."
    KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
    curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
    
    echo "Downloading kubectl checksum..."
    curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256"
    
    echo "Verifying kubectl checksum..."
    if echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check; then
        echo -e "${GREEN}✓ Checksum verified${NC}"
    else
        echo -e "${RED}✗ Checksum verification failed${NC}"
        rm -f kubectl kubectl.sha256
        exit 1
    fi
    
    echo "Installing kubectl..."
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    
    echo "Cleaning up..."
    rm -f kubectl kubectl.sha256
    
    echo -e "${GREEN}✓ kubectl installed successfully${NC}"
    kubectl version --client
fi

# Step 7: Install k3s (optional)
if [ "$SKIP_K3S" = false ]; then
    print_section "7. Installing k3s (Lightweight Kubernetes)"
    if command_exists k3s; then
        echo -e "${YELLOW}k3s is already installed${NC}"
        k3s --version
    else
        echo "Installing k3s..."
        curl -sfL https://get.k3s.io | sh -
        
        echo -e "${GREEN}✓ k3s installed successfully${NC}"
        k3s --version
    fi
    
    # Step 8: Configure kubeconfig
    print_section "8. Configuring kubeconfig for ${DEPLOY_USER}"
    KUBE_DIR="/home/${DEPLOY_USER}/.kube"
    
    # Create .kube directory if it doesn't exist
    if [ ! -d "${KUBE_DIR}" ]; then
        if [ "${DEPLOY_USER}" = "${USER}" ]; then
            mkdir -p "${KUBE_DIR}"
            chmod 755 "${KUBE_DIR}"
        else
            sudo -u "${DEPLOY_USER}" mkdir -p "${KUBE_DIR}"
            sudo chmod 755 "${KUBE_DIR}"
        fi
    fi
    
    # Copy k3s kubeconfig
    if [ -f /etc/rancher/k3s/k3s.yaml ]; then
        sudo cp /etc/rancher/k3s/k3s.yaml "${KUBE_DIR}/config"
        
        if [ "${DEPLOY_USER}" = "${USER}" ]; then
            sudo chown $(id -u):$(id -g) "${KUBE_DIR}/config"
        else
            DEPLOY_UID=$(id -u "${DEPLOY_USER}")
            DEPLOY_GID=$(id -g "${DEPLOY_USER}")
            sudo chown ${DEPLOY_UID}:${DEPLOY_GID} "${KUBE_DIR}/config"
        fi
        
        echo -e "${GREEN}✓ kubeconfig configured at ${KUBE_DIR}/config${NC}"
    else
        echo -e "${YELLOW}⚠️  k3s kubeconfig not found at /etc/rancher/k3s/k3s.yaml${NC}"
        echo "    k3s may still be starting up"
    fi
else
    echo -e "${YELLOW}Skipping k3s installation (--skip-k3s flag set)${NC}"
fi

# Step 9: Configure firewall
print_section "9. Configuring firewall (UFW)"
if command_exists ufw; then
    echo "Configuring UFW firewall rules..."
    
    # Allow SSH
    sudo ufw allow 22/tcp comment 'SSH' || true
    
    # Allow NodePort range for Kubernetes services
    sudo ufw allow 30000:32767/tcp comment 'Kubernetes NodePort' || true
    
    # Enable firewall if not already enabled
    if ! sudo ufw status | grep -q "Status: active"; then
        echo "Enabling UFW firewall..."
        echo "y" | sudo ufw enable
    fi
    
    echo -e "${GREEN}✓ Firewall configured${NC}"
    sudo ufw status
else
    echo -e "${YELLOW}⚠️  UFW not found, skipping firewall configuration${NC}"
fi

# Step 10: Configure git
print_section "10. Configuring git"
if ! git config --global user.name >/dev/null 2>&1; then
    echo -e "${YELLOW}Git user.name not configured${NC}"
    echo "You can configure it later with: git config --global user.name \"Your Name\""
fi

if ! git config --global user.email >/dev/null 2>&1; then
    echo -e "${YELLOW}Git user.email not configured${NC}"
    echo "You can configure it later with: git config --global user.email \"your.email@example.com\""
fi

echo -e "${GREEN}✓ Git configuration checked${NC}"

# Final verification
print_section "Verification"
echo "Running verification checks..."
echo ""

# Check git
if command_exists git; then
    echo -e "${GREEN}✓ git: $(git --version)${NC}"
else
    echo -e "${RED}✗ git: Not installed${NC}"
fi

# Check Docker
if command_exists docker; then
    echo -e "${GREEN}✓ docker: $(docker --version)${NC}"
    if sudo systemctl is-active --quiet docker; then
        echo -e "${GREEN}  Docker daemon is running${NC}"
    else
        echo -e "${YELLOW}  Docker daemon is not running${NC}"
    fi
else
    echo -e "${RED}✗ docker: Not installed${NC}"
fi

# Check kubectl
if command_exists kubectl; then
    echo -e "${GREEN}✓ kubectl: $(kubectl version --client --short 2>/dev/null || kubectl version --client)${NC}"
else
    echo -e "${RED}✗ kubectl: Not installed${NC}"
fi

# Check k3s
if [ "$SKIP_K3S" = false ]; then
    if command_exists k3s; then
        echo -e "${GREEN}✓ k3s: $(k3s --version | head -n1)${NC}"
        if sudo systemctl is-active --quiet k3s; then
            echo -e "${GREEN}  k3s service is running${NC}"
        else
            echo -e "${YELLOW}  k3s service is not running${NC}"
        fi
    else
        echo -e "${RED}✗ k3s: Not installed${NC}"
    fi
    
    # Check kubectl cluster access
    if [ "${DEPLOY_USER}" = "${USER}" ] && [ -f "${HOME}/.kube/config" ]; then
        if kubectl get nodes >/dev/null 2>&1; then
            echo -e "${GREEN}✓ kubectl can access cluster${NC}"
        else
            echo -e "${YELLOW}  kubectl cannot access cluster (may need to wait for k3s to start)${NC}"
        fi
    fi
fi

# Check disk space
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
echo -e "${GREEN}✓ Disk space available: ${DISK_AVAILABLE}${NC}"

# Summary
echo ""
print_section "Installation Complete!"
echo ""
echo -e "${GREEN}✓ All prerequisites installed successfully!${NC}"
echo ""
echo "Next Steps:"
echo "───────────"
echo "1. ${YELLOW}Log out and log back in${NC} for Docker group membership to take effect"
echo "   Or run: ${BLUE}newgrp docker${NC}"
echo ""
echo "2. Verify Docker access without sudo:"
echo "   ${BLUE}docker ps${NC}"
echo ""
echo "3. Set up SSH key for deployment:"
echo "   ${BLUE}mkdir -p ~/.ssh${NC}"
echo "   ${BLUE}chmod 700 ~/.ssh${NC}"
echo "   ${BLUE}# Add your public key to ~/.ssh/authorized_keys${NC}"
echo ""
echo "4. Configure GitHub Secrets in your repository:"
echo "   - SSH_PRIVATE_KEY: Your SSH private key"
echo "   - SERVER_IP: This server's IP address"
echo "   - SERVER_USER: ${DEPLOY_USER}"
echo ""
echo "5. Test deployment by pushing to main branch"
echo ""
echo "For troubleshooting, see: ${BLUE}docs/DEPLOYMENT_PREREQS.md${NC}"
echo ""
