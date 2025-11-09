# Auto-Deployment Setup Guide

This guide explains how to set up automatic deployment to your production server at `moshe-makies.dev` (129.159.130.84) using Kubernetes.

## Overview

The repository is configured with GitHub Actions to automatically deploy your Windows XP Portfolio to your production server whenever changes are pushed to the `main` branch using Kubernetes (k3s).

## Prerequisites

1. **Server Requirements:**
   - Ubuntu/Debian Linux server at 129.159.130.84
   - Docker and Kubernetes (k3s) installed
   - Domain `moshe-makies.dev` pointing to 129.159.130.84
   - At least 8GB RAM and 20GB free disk space

2. **SSH Access:**
   - SSH access to the server
   - SSH key pair for authentication

## Setup Instructions

### Step 1: Prepare Your Server

SSH into your server and run the automated setup script:

```bash
# Connect to your server
ssh your_user@129.159.130.84

# Clone the repository (if not already done)
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

# Run the setup script (installs Docker, kubectl, k3s, etc.)
./scripts/setup-server.sh
```

This script will install:
- Docker
- kubectl
- k3s (lightweight Kubernetes)
- Git and other dependencies
- Configure firewall rules
- Create deployment directory


### Step 2: Configure GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_PRIVATE_KEY` | Your SSH private key | The private key used to authenticate with the server |
| `SERVER_IP` | `129.159.130.84` | Your server's IP address |
| `SERVER_USER` | `ubuntu` (or your username) | SSH username for the server |
| `DOMAIN` | `moshe-makies.dev` | Your domain name |

#### Getting Your SSH Private Key

If you don't have an SSH key pair:

```bash
# On your local machine, generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy

# Copy the public key to your server
ssh-copy-id -i ~/.ssh/github_deploy.pub your_user@129.159.130.84

# Display the private key to copy into GitHub secrets
cat ~/.ssh/github_deploy
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) and paste it as the `SSH_PRIVATE_KEY` secret in GitHub.

### Step 3: Configure Nginx for Domain

On your server, you should configure Nginx to handle the domain `moshe-makies.dev`. The application runs on port 80 by default.

If you want to add SSL/HTTPS, you can use Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d moshe-makies.dev

# Certbot will automatically configure Nginx
```

### Step 4: Test the Deployment

#### Option 1: Automatic Deployment (via GitHub Actions)

Simply push changes to the `main` branch:

```bash
git checkout main
git push origin main
```

The GitHub Actions workflow will automatically:
1. Connect to your server via SSH
2. Pull the latest code
3. Build Docker images
4. Deploy to Kubernetes
5. Verify the deployment

You can monitor the deployment in the **Actions** tab of your GitHub repository.

#### Option 2: Manual Deployment

You can also deploy manually using the deployment script:

```bash
# Set environment variables
export SSH_PRIVATE_KEY_PATH=~/.ssh/github_deploy
export SERVER_USER=ubuntu
export SERVER_IP=129.159.130.84

# Run the deployment script
./scripts/deploy-remote.sh
```

### Step 5: Verify Deployment

After deployment, verify the application is running:

```bash
# Get the NodePort (usually 30080)
kubectl get svc client-service -n portfolio

# Check pods status
kubectl get pods -n portfolio

# Access the application (replace PORT with the NodePort)
curl http://moshe-makies.dev:PORT
# Or visit in browser: http://moshe-makies.dev:PORT
```

## Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) performs these steps:

1. **Checkout code** - Gets the latest code from the repository
2. **Set up SSH** - Configures SSH authentication using the secret key
3. **Deploy to server** - Connects to the server and:
   - Pulls/clones the repository
   - Builds Docker images
   - Deploys to Kubernetes cluster
   - Waits for pods to be ready
   - Verifies deployment status
   - Cleans up old images
4. **Verify deployment** - Confirms successful deployment

## Monitoring and Maintenance

### View Logs

SSH into your server and run:

```bash
# View all pods
kubectl get pods -n portfolio

# View specific pod logs
kubectl logs -f deployment/portfolio-client -n portfolio
kubectl logs -f deployment/llm-service -n portfolio
kubectl logs -f deployment/file-service -n portfolio

# Stream logs from all pods of a deployment
kubectl logs -f -l app=portfolio-client -n portfolio
```

### Restart Services

```bash
# Restart all deployments
kubectl rollout restart deployment/portfolio-client -n portfolio
kubectl rollout restart deployment/llm-service -n portfolio
kubectl rollout restart deployment/file-service -n portfolio

# Or use the manual workflow from GitHub Actions
```

### Scale Services

```bash
# Scale the client
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio

# Scale file service
kubectl scale deployment/file-service --replicas=2 -n portfolio
```

### Check Service Status

```bash
# Check pod status
kubectl get pods -n portfolio

# Get detailed pod information
kubectl describe pod <pod-name> -n portfolio

# Check services
kubectl get svc -n portfolio

# Check persistent volume claims
kubectl get pvc -n portfolio
```

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs:**
   - Go to the **Actions** tab in your repository
   - Click on the failed workflow run
   - Review the error messages

2. **Verify SSH access:**
   ```bash
   ssh -i ~/.ssh/github_deploy your_user@129.159.130.84
   ```

3. **Check Kubernetes cluster:**
   ```bash
   ssh your_user@129.159.130.84
   kubectl get pods -n portfolio
   kubectl get events -n portfolio --sort-by='.lastTimestamp'
   ```

### Pods Not Starting

1. **Check pod status:**
   ```bash
   kubectl get pods -n portfolio
   kubectl describe pod <pod-name> -n portfolio
   ```

2. **Check pod logs:**
   ```bash
   kubectl logs <pod-name> -n portfolio
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Check memory:**
   ```bash
   free -h
   kubectl top nodes
   kubectl top pods -n portfolio
   ```

### Domain Not Resolving

1. **Verify DNS settings:**
   ```bash
   nslookup moshe-makies.dev
   dig moshe-makies.dev
   ```

2. **Check NodePort service:**
   ```bash
   kubectl get svc client-service -n portfolio
   # Note the NodePort and access via http://moshe-makies.dev:<NodePort>
   ```

## Security Recommendations

1. **Use SSH keys only** - Never use password authentication
2. **Keep secrets secure** - Never commit secrets to the repository
3. **Enable firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 6443/tcp  # Kubernetes API
   sudo ufw allow 30000:32767/tcp  # Kubernetes NodePort range
   sudo ufw enable
   ```
4. **Enable SSL/HTTPS** - Use Let's Encrypt for free SSL certificates
5. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   # Update container images by redeploying
   ```

## Useful Commands

```bash
# Manual deployment
./scripts/deploy-remote.sh

# SSH to server
ssh your_user@129.159.130.84

# View running pods
kubectl get pods -n portfolio

# View all resources
kubectl get all -n portfolio

# View pod logs
kubectl logs -f deployment/portfolio-client -n portfolio

# Restart a deployment
kubectl rollout restart deployment/portfolio-client -n portfolio

# Scale a deployment
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio

# Delete all resources in namespace
kubectl delete namespace portfolio

# Check cluster status
kubectl cluster-info

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -n portfolio
docker system prune -a --volumes
```

## Support

For issues or questions:
- Open an issue on GitHub
- Email: mhm23811@gmail.com
- LinkedIn: https://www.linkedin.com/in/moshe-haim-makias/
