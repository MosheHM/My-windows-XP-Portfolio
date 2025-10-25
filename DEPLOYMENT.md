# Auto-Deployment Setup Guide

This guide explains how to set up automatic deployment to your production server at `moshe-makies.dev` (129.159.130.84).

## Overview

The repository is configured with GitHub Actions to automatically deploy your Windows XP Portfolio to your production server whenever changes are pushed to the `main` branch.

## Prerequisites

1. **Server Requirements:**
   - Ubuntu/Debian Linux server at 129.159.130.84
   - Docker and Docker Compose installed
   - Domain `moshe-makies.dev` pointing to 129.159.130.84
   - At least 8GB RAM and 20GB free disk space

2. **SSH Access:**
   - SSH access to the server
   - SSH key pair for authentication

## Setup Instructions

### Step 1: Prepare Your Server

SSH into your server and prepare it:

```bash
# Connect to your server
ssh your_user@129.159.130.84

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose (if not already installed)
sudo apt install docker-compose-plugin -y

# Create deployment directory
sudo mkdir -p /opt/portfolio
sudo chown -R $USER:$USER /opt/portfolio

# Verify Docker is running
docker --version
docker compose version
```

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
4. Deploy the application
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
# Check the application
curl http://moshe-makies.dev/health

# Or visit in browser
# http://moshe-makies.dev
```

## Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) performs these steps:

1. **Checkout code** - Gets the latest code from the repository
2. **Set up SSH** - Configures SSH authentication using the secret key
3. **Deploy to server** - Connects to the server and:
   - Pulls/clones the repository
   - Stops existing containers
   - Builds new Docker images
   - Starts the services
   - Verifies health
   - Cleans up old images
4. **Verify deployment** - Confirms successful deployment

## Monitoring and Maintenance

### View Logs

SSH into your server and run:

```bash
# View all logs
docker compose -f /opt/portfolio/docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f /opt/portfolio/docker-compose.prod.yml logs -f nginx-gateway
docker compose -f /opt/portfolio/docker-compose.prod.yml logs -f client
docker compose -f /opt/portfolio/docker-compose.prod.yml logs -f llm-service
docker compose -f /opt/portfolio/docker-compose.prod.yml logs -f file-service
```

### Restart Services

```bash
# Restart all services
docker compose -f /opt/portfolio/docker-compose.prod.yml restart

# Restart specific service
docker compose -f /opt/portfolio/docker-compose.prod.yml restart nginx-gateway
```

### Stop Services

```bash
docker compose -f /opt/portfolio/docker-compose.prod.yml down
```

### Check Service Status

```bash
docker compose -f /opt/portfolio/docker-compose.prod.yml ps
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

3. **Check server logs:**
   ```bash
   ssh your_user@129.159.130.84
   docker compose -f /opt/portfolio/docker-compose.prod.yml logs
   ```

### Services Not Starting

1. **Check Docker:**
   ```bash
   docker ps -a
   docker compose -f /opt/portfolio/docker-compose.prod.yml ps
   ```

2. **Check disk space:**
   ```bash
   df -h
   ```

3. **Check memory:**
   ```bash
   free -h
   ```

### Domain Not Resolving

1. **Verify DNS settings:**
   ```bash
   nslookup moshe-makies.dev
   dig moshe-makies.dev
   ```

2. **Check Nginx configuration:**
   ```bash
   docker compose -f /opt/portfolio/docker-compose.prod.yml logs nginx-gateway
   ```

## Security Recommendations

1. **Use SSH keys only** - Never use password authentication
2. **Keep secrets secure** - Never commit secrets to the repository
3. **Enable firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. **Enable SSL/HTTPS** - Use Let's Encrypt for free SSL certificates
5. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker compose -f /opt/portfolio/docker-compose.prod.yml pull
   ```

## Useful Commands

```bash
# Manual deployment
./scripts/deploy-remote.sh

# SSH to server
ssh your_user@129.159.130.84

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Check disk usage
docker system df

# Full cleanup (be careful!)
docker system prune -a --volumes
```

## Support

For issues or questions:
- Open an issue on GitHub
- Email: mhm23811@gmail.com
- LinkedIn: https://www.linkedin.com/in/moshe-haim-makias/
