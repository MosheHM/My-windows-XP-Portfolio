# Quick Start: Auto-Deployment Setup

This guide provides a quick overview of setting up auto-deployment for your Windows XP Portfolio to moshe-makies.dev using Kubernetes.

## 🎯 What This Does

Automatically deploys your portfolio to your server at `129.159.130.84` (moshe-makies.dev) using Kubernetes whenever you push to the `main` branch.

## ⚡ Quick Setup (5 Steps)

### Step 1: Prepare Your Server

SSH into your server and run the setup script:

```bash
# Clone the repository to your server
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

# Run the setup script (installs Docker, kubectl, k3s)
./scripts/setup-server.sh
```

This installs Docker, kubectl, k3s (lightweight Kubernetes), and prepares the deployment directory.

### Step 2: Generate SSH Key

On your **local machine**, generate a deployment key:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
```

Copy the public key to your server:

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub your_user@129.159.130.84
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/MosheHM/My-windows-XP-Portfolio
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these 4 secrets:

| Name | Value |
|------|-------|
| `SSH_PRIVATE_KEY` | Content of `~/.ssh/github_deploy` (your private key) |
| `SERVER_IP` | `129.159.130.84` |
| `SERVER_USER` | Your SSH username (e.g., `ubuntu`) |
| `DOMAIN` | `moshe-makies.dev` |

To get your private key content:
```bash
cat ~/.ssh/github_deploy
```

Copy the entire output including the header and footer lines.

### Step 4: Configure DNS

Ensure your domain `moshe-makies.dev` points to your server IP `129.159.130.84`:

```bash
# Verify DNS is configured correctly
nslookup moshe-makies.dev
# Should return 129.159.130.84
```

### Step 5: Deploy!

Simply push to the main branch:

```bash
git checkout main
git push origin main
```

The GitHub Actions workflow will automatically:
1. Connect to your server
2. Pull the latest code
3. Build Docker images
4. Deploy to Kubernetes
5. Verify pods are running

## 🎉 Access Your Application

After deployment, get the NodePort:
```bash
kubectl get svc client-service -n portfolio
```

Access via:
- **Domain**: http://moshe-makies.dev:NodePort (e.g., http://moshe-makies.dev:30080)
- **Direct IP**: http://129.159.130.84:NodePort

## 🔄 Additional Operations

### Manual Deployment

Deploy without pushing to GitHub:

```bash
# Set your SSH key path
export SSH_PRIVATE_KEY_PATH=~/.ssh/github_deploy

# Run deployment script
./scripts/deploy-remote.sh
```

### Manual Workflows

You can also trigger manual actions from GitHub:

1. Go to **Actions** tab in your repository
2. Select **Manual Deployment & Rollback**
3. Click **Run workflow**
4. Choose action:
   - **Deploy**: Deploy a specific branch
   - **Rollback**: Rollback to previous version
   - **Restart**: Restart services

### View Logs

SSH to your server and run:

```bash
# View pod logs
kubectl logs -f deployment/portfolio-client -n portfolio

# View all pods
kubectl get pods -n portfolio

# View specific pod logs
kubectl logs <pod-name> -n portfolio
```

## 📚 Full Documentation

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md)

## ⚠️ Troubleshooting

### Deployment Failed?

1. Check GitHub Actions logs in the **Actions** tab
2. Verify SSH access: `ssh your_user@129.159.130.84`
3. Check Kubernetes pods: `kubectl get pods -n portfolio`

### Pods Not Starting?

```bash
# SSH to server
ssh your_user@129.159.130.84

# Check pods
kubectl get pods -n portfolio

# Check pod details
kubectl describe pod <pod-name> -n portfolio

# Check disk space
df -h

# Check memory
free -h
```

### Domain Not Working?

```bash
# Verify DNS
nslookup moshe-makies.dev

# Check nginx
docker compose -f /opt/portfolio/docker-compose.prod.yml logs nginx-gateway
```

## 🆘 Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed documentation
- Open an issue on GitHub
- Email: mhm23811@gmail.com

## 🎊 Success!

Once everything is set up, every push to `main` will automatically deploy to your server!

```
┌─────────────────────────────────────────┐
│  git push origin main                   │
│                                         │
│  ↓                                      │
│                                         │
│  GitHub Actions                         │
│                                         │
│  ↓                                      │
│                                         │
│  Your Server (129.159.130.84)          │
│                                         │
│  ↓                                      │
│                                         │
│  http://moshe-makies.dev ✨            │
└─────────────────────────────────────────┘
```
