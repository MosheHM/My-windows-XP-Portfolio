# Example: Complete Auto-Deployment Setup

This document provides a complete walkthrough example of setting up auto-deployment for moshe-makies.dev.

## Prerequisites

- Server: Ubuntu 22.04 at 129.159.130.84
- Domain: moshe-makies.dev pointing to 129.159.130.84
- SSH access to the server
- GitHub account with repository access

## Step-by-Step Example

### 1. Generate SSH Key Pair

On your local machine:

```bash
# Generate a new SSH key specifically for deployment
$ ssh-keygen -t ed25519 -C "github-deploy-moshe-makies" -f ~/.ssh/github_deploy
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase): [Press Enter]
Enter same passphrase again: [Press Enter]
Your identification has been saved in /home/user/.ssh/github_deploy
Your public key has been saved in /home/user/.ssh/github_deploy.pub

# Display the private key (you'll need this for GitHub)
$ cat ~/.ssh/github_deploy
-----BEGIN OPENSSH PRIVATE KEY-----
[Your private key content will appear here]
-----END OPENSSH PRIVATE KEY-----

# Display the public key
$ cat ~/.ssh/github_deploy.pub
ssh-ed25519 AAAAC3Nza... github-deploy-moshe-makies
```

### 2. Copy Public Key to Server

```bash
# Copy the public key to your server
$ ssh-copy-id -i ~/.ssh/github_deploy.pub ubuntu@129.159.130.84
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/user/.ssh/github_deploy.pub"
Number of key(s) added: 1

# Test SSH connection
$ ssh -i ~/.ssh/github_deploy ubuntu@129.159.130.84
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)
ubuntu@server:~$
```

### 3. Prepare the Server

SSH into your server and run the setup script:

```bash
# Connect to server
$ ssh ubuntu@129.159.130.84

# Create a temporary directory and download the setup script
ubuntu@server:~$ mkdir -p ~/portfolio-setup
ubuntu@server:~$ cd ~/portfolio-setup

# Clone the repository to get the setup script
ubuntu@server:~/portfolio-setup$ git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
Cloning into 'My-windows-XP-Portfolio'...
remote: Enumerating objects: 150, done.
remote: Counting objects: 100% (150/150), done.
remote: Compressing objects: 100% (100/100), done.
remote: Total 150 (delta 50), reused 120 (delta 30), pack-reused 0
Receiving objects: 100% (150/150), 50.00 KiB | 1.00 MiB/s, done.
Resolving deltas: 100% (50/50), done.

# Run the setup script
ubuntu@server:~/portfolio-setup$ cd My-windows-XP-Portfolio
ubuntu@server:~/portfolio-setup/My-windows-XP-Portfolio$ chmod +x scripts/setup-server.sh
ubuntu@server:~/portfolio-setup/My-windows-XP-Portfolio$ ./scripts/setup-server.sh

🔧 Setting up production server for Windows XP Portfolio
==========================================================

📦 Updating system packages...
✅ Docker already installed
✅ Docker Compose already installed
✅ Git already installed
✅ curl already installed
📁 Creating deployment directory...
✅ Deployment directory created: /opt/portfolio
🔥 Configuring firewall...
✅ Firewall configured

Do you want to install Certbot for SSL certificates? (y/n) n

==========================================================
✅ Server setup completed!
==========================================================

Server Information:
-------------------
Hostname: moshe-server
IP Address: 129.159.130.84
Docker version: Docker version 24.0.7, build afdd53b
Docker Compose version: Docker Compose version v2.23.3
Git version: git version 2.34.1
Deployment directory: /opt/portfolio

# Clean up
ubuntu@server:~/portfolio-setup/My-windows-XP-Portfolio$ cd ~
ubuntu@server:~$ rm -rf ~/portfolio-setup

# Log out
ubuntu@server:~$ exit
```

### 4. Configure GitHub Secrets

Go to your repository on GitHub:

1. Navigate to: `https://github.com/MosheHM/My-windows-XP-Portfolio/settings/secrets/actions`
2. Click "New repository secret"
3. Add these 4 secrets:

**Secret 1: SSH_PRIVATE_KEY**
```
Name: SSH_PRIVATE_KEY
Value: [Paste the content from cat ~/.ssh/github_deploy]
-----BEGIN OPENSSH PRIVATE KEY-----
[Your private key content]
-----END OPENSSH PRIVATE KEY-----
```

**Secret 2: SERVER_IP**
```
Name: SERVER_IP
Value: 129.159.130.84
```

**Secret 3: SERVER_USER**
```
Name: SERVER_USER
Value: ubuntu
```

**Secret 4: DOMAIN**
```
Name: DOMAIN
Value: moshe-makies.dev
```

### 5. Verify DNS Configuration

Make sure your domain points to the server:

```bash
$ nslookup moshe-makies.dev
Server:     8.8.8.8
Address:    8.8.8.8#53

Non-authoritative answer:
Name:   moshe-makies.dev
Address: 129.159.130.84

# Or use dig
$ dig moshe-makies.dev +short
129.159.130.84
```

### 6. First Deployment

Push to the main branch to trigger auto-deployment:

```bash
# Make sure you're on a feature branch
$ git checkout -b setup-deployment

# Merge into main
$ git checkout main
$ git merge setup-deployment

# Push to trigger deployment
$ git push origin main
Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Delta compression using up to 8 threads
Compressing objects: 100% (5/5), done.
Writing objects: 100% (6/6), 2.50 KiB | 2.50 MiB/s, done.
Total 6 (delta 3), reused 0 (delta 0), pack-reused 0
To github.com:MosheHM/My-windows-XP-Portfolio.git
   a1b2c3d..e4f5g6h  main -> main
```

### 7. Monitor Deployment

Watch the deployment in GitHub Actions:

1. Go to: `https://github.com/MosheHM/My-windows-XP-Portfolio/actions`
2. Click on the latest "Deploy to Production" workflow run
3. Watch the deployment progress:

```
Run actions/checkout@v4
  Checking out repository...
  ✅ Complete

Set up SSH
  Creating SSH directory...
  Adding SSH key...
  ✅ Complete

Deploy to server
  🚀 Starting deployment to moshe-makies.dev...
  📦 Pulling latest changes...
  🛑 Stopping existing containers...
  🔨 Building Docker images...
  ▶️  Starting services...
  ⏳ Waiting for services to be ready...
  ✅ Deployment successful!
  🌐 Application is running at http://moshe-makies.dev
  🧹 Cleaning up old Docker images...
  ✅ Complete
```

### 8. Verify Deployment

Check that everything is working:

```bash
# Check health endpoint
$ curl http://moshe-makies.dev/health
healthy

# Check the homepage
$ curl -I http://moshe-makies.dev/
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/html
...

# Or visit in browser
# Open http://moshe-makies.dev in your browser
```

### 9. View Server Logs (Optional)

SSH to the server to view logs:

```bash
$ ssh ubuntu@129.159.130.84

# View all service logs
ubuntu@server:~$ docker compose -f /opt/portfolio/docker-compose.prod.yml logs -f

# Or view specific service
ubuntu@server:~$ docker compose -f /opt/portfolio/docker-compose.prod.yml logs nginx-gateway

# Check running containers
ubuntu@server:~$ docker ps
CONTAINER ID   IMAGE                    STATUS         PORTS
abc123def456   nginx-gateway-prod      Up 5 minutes   0.0.0.0:80->80/tcp
def456ghi789   client-prod             Up 5 minutes   80/tcp
ghi789jkl012   llm-service-prod        Up 5 minutes   8000/tcp
jkl012mno345   file-service-prod       Up 5 minutes   8001/tcp
```

## Automatic Deployments

Now, every time you push to the main branch, the deployment will happen automatically:

```bash
# Make changes
$ git add .
$ git commit -m "Update portfolio content"
$ git push origin main

# GitHub Actions automatically:
# 1. Checks out code
# 2. Connects to server
# 3. Pulls changes
# 4. Rebuilds images
# 5. Restarts services
# 6. Verifies health

# Your changes are live at moshe-makies.dev!
```

## Manual Operations

### Manual Deployment

Use the deployment script:

```bash
$ export SSH_PRIVATE_KEY_PATH=~/.ssh/github_deploy
$ ./scripts/deploy-remote.sh
```

### Manual Rollback

Use GitHub Actions:

1. Go to Actions → Manual Deployment & Rollback
2. Click "Run workflow"
3. Select "rollback"
4. Click "Run workflow"

### Restart Services

```bash
# Via GitHub Actions
1. Go to Actions → Manual Deployment & Rollback
2. Click "Run workflow"
3. Select "restart"

# Or via SSH
$ ssh ubuntu@129.159.130.84
$ docker compose -f /opt/portfolio/docker-compose.prod.yml restart
```

## Success! 🎉

Your Windows XP Portfolio is now automatically deployed to moshe-makies.dev. Every push to main will update the production site!

```
┌─────────────────────────────────────────┐
│                                         │
│  git push origin main                   │
│           ↓                             │
│  GitHub Actions Workflow                │
│           ↓                             │
│  Deploy to 129.159.130.84              │
│           ↓                             │
│  http://moshe-makies.dev ✨            │
│                                         │
└─────────────────────────────────────────┘
```
