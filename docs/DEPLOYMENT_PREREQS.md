# Deployment Prerequisites for moshe-makies.dev

This document lists the software, services, and configuration that must be present on the target deployment machine where the GitHub Actions remote-deploy SSH script runs. It was added after a failed run where the remote server did not have Docker installed (see job ref: c8cde0f46e609b3fca6112962a44e07d81583ea6).

## Summary

The deployment workflow (`/.github/workflows/deploy.yml`) SSHes into the target server and runs commands that:
- clone/pull the repository
- build Docker images (docker build)
- apply Kubernetes manifests (kubectl apply)
- query deployments and services (kubectl get/wait)

To ensure those steps succeed, the server must have the tools and configuration described below.

## Required software and services

- **git** - for cloning and pulling repository updates
- **Docker** (docker daemon and CLI) - for building container images
- **kubectl** (Kubernetes CLI) - configured to talk to your cluster
- **sudo** - if the deploy user does not run Docker as root
- **SSH server (sshd)** - configured to accept the deployment user's SSH key

Optional but recommended:
- Add the deploy user to the `docker` group to avoid using sudo
- A way to make built images available to your cluster (either running Kubernetes that uses the local Docker daemon, or a container registry and `docker push`)

## Ubuntu / Debian installation (tested on Ubuntu 20.04+)

### 1. Update packages

```bash
sudo apt-get update
```

### 2. Install git, curl, and prerequisite packages

```bash
sudo apt-get install -y git curl apt-transport-https ca-certificates software-properties-common gnupg lsb-release
```

### 3. Install Docker

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 4. Start and enable Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 5. Add deploy user to docker group

Replace `deployuser` with your actual deployment user:

```bash
sudo usermod -aG docker deployuser
```

**Important:** The user needs to log out and log back in for group membership to take effect, or run:

```bash
newgrp docker
```

### 6. Install kubectl

```bash
# Download the latest release
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Clean up
rm kubectl
```

### 7. Configure kubeconfig

Ensure the deploy user has access to the kubeconfig file. If using k3s:

```bash
# If using k3s, copy the kubeconfig to the user's home directory
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config

# Or set KUBECONFIG environment variable
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

For other Kubernetes distributions, ensure `~/.kube/config` points to your cluster.

### 8. Verification commands (Ubuntu/Debian)

```bash
# Verify git
git --version

# Verify Docker
docker --version
docker info

# Verify Docker daemon is running
sudo systemctl status docker

# Test Docker without sudo (after adding user to docker group and re-login)
docker ps

# Verify kubectl
kubectl version --client
kubectl cluster-info

# Verify kubectl can access the cluster
kubectl get nodes
kubectl get namespaces
```

## CentOS / RHEL installation (tested on CentOS 7/8, RHEL 8+)

### 1. Update packages

```bash
# For CentOS 7
sudo yum update -y

# For CentOS 8+ / RHEL 8+
sudo dnf update -y
```

### 2. Install git and prerequisite packages

```bash
# For CentOS 7
sudo yum install -y git curl yum-utils

# For CentOS 8+ / RHEL 8+
sudo dnf install -y git curl dnf-utils
```

### 3. Install Docker

**For CentOS 7:**

```bash
# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**For CentOS 8+ / RHEL 8+:**

```bash
# Add Docker repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 4. Start and enable Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 5. Add deploy user to docker group

Replace `deployuser` with your actual deployment user:

```bash
sudo usermod -aG docker deployuser
```

**Important:** The user needs to log out and log back in for group membership to take effect, or run:

```bash
newgrp docker
```

### 6. Install kubectl

```bash
# Download the latest release
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Clean up
rm kubectl
```

### 7. Configure kubeconfig

Same as Ubuntu/Debian section above.

### 8. Verification commands (CentOS/RHEL)

```bash
# Verify git
git --version

# Verify Docker
docker --version
docker info

# Verify Docker daemon is running
sudo systemctl status docker

# Test Docker without sudo (after adding user to docker group and re-login)
docker ps

# Verify kubectl
kubectl version --client
kubectl cluster-info

# Verify kubectl can access the cluster
kubectl get nodes
kubectl get namespaces
```

## SSH Configuration

### 1. Ensure SSH server is running

**Ubuntu/Debian:**

```bash
sudo systemctl status ssh
# If not running:
sudo systemctl enable ssh
sudo systemctl start ssh
```

**CentOS/RHEL:**

```bash
sudo systemctl status sshd
# If not running:
sudo systemctl enable sshd
sudo systemctl start sshd
```

### 2. Set up SSH key for deployment user

On the **deployment machine**, add the GitHub Actions public key to authorized_keys:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the public key to authorized_keys
# (The corresponding private key should be in GitHub Secrets as SSH_PRIVATE_KEY)
echo "ssh-rsa YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Configure known_hosts (optional)

The deployment script uses `ssh-keyscan` to add the host key automatically, but you can pre-populate it:

```bash
ssh-keyscan -H YOUR_SERVER_IP >> ~/.ssh/known_hosts
```

## Networking and Firewall Configuration

### 1. Open required ports

The deployment uses Kubernetes NodePort services. By default, NodePort range is 30000-32767.

**Ubuntu/Debian (ufw):**

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow NodePort range for Kubernetes services
sudo ufw allow 30000:32767/tcp

# Enable firewall
sudo ufw enable
```

**CentOS/RHEL (firewalld):**

```bash
# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh

# Allow NodePort range for Kubernetes services
sudo firewall-cmd --permanent --add-port=30000-32767/tcp

# Reload firewall
sudo firewall-cmd --reload
```

### 2. Verify open ports

```bash
# Check firewall status
# Ubuntu/Debian:
sudo ufw status

# CentOS/RHEL:
sudo firewall-cmd --list-all

# Check listening ports
sudo netstat -tlnp | grep LISTEN
# or
sudo ss -tlnp | grep LISTEN
```

## Git Configuration

### 1. Configure git user (optional but recommended)

```bash
git config --global user.name "Deploy User"
git config --global user.email "deploy@yourdomain.com"
```

### 2. Verify repository access

```bash
# Test cloning the repository
cd /tmp
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git test-clone
rm -rf test-clone
```

## Kubernetes Cluster Requirements

### 1. Ensure cluster is running

For k3s:

```bash
sudo systemctl status k3s
```

For other distributions, check your cluster's status.

### 2. Verify namespace access

The deployment creates a `portfolio` namespace:

```bash
kubectl get namespace portfolio
# If it doesn't exist, it will be created by the deployment
```

### 3. Ensure local images are available to cluster

If using k3s or Docker Desktop Kubernetes, images built locally are automatically available.

If using a remote cluster, you'll need to:
- Push images to a container registry (Docker Hub, GCR, etc.)
- Update the deployment manifests to pull from the registry
- Configure image pull secrets if using a private registry

## Troubleshooting

### Issue: "sudo: docker: command not found"

**Solution:** Docker is not installed. Follow the Docker installation steps above.

### Issue: "permission denied while trying to connect to the Docker daemon socket"

**Solution:** The user is not in the docker group or hasn't logged out/in after being added.

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group membership without logging out
newgrp docker

# Or log out and log back in
```

### Issue: "The connection to the server localhost:8080 was refused"

**Solution:** kubectl is not configured properly. Check kubeconfig:

```bash
# Check kubeconfig
kubectl config view

# For k3s, ensure kubeconfig points to the right file
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
# Or copy it to default location:
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
```

### Issue: "Host key verification failed"

**Solution:** Add the server to known_hosts:

```bash
ssh-keyscan -H YOUR_SERVER_IP >> ~/.ssh/known_hosts
```

### Issue: Images not found by Kubernetes pods

**Solution:** For k3s, ensure it's using the local Docker daemon:

```bash
# Check if k3s is configured to use local containerd or docker
# With k3s, you may need to import images explicitly:
sudo k3s ctr images import <image-tar-file>

# Or configure k3s to use Docker:
# Install k3s with --docker flag
curl -sfL https://get.k3s.io | sh -s - --docker
```

### Issue: Port already in use

**Solution:** Check what's using the port and stop it or change the NodePort in the service definition:

```bash
# Find what's using a port
sudo lsof -i :PORT_NUMBER
sudo netstat -tlnp | grep PORT_NUMBER
```

## Pre-Deployment Verification Checklist

Before running the GitHub Actions deployment, verify all prerequisites on the target server:

```bash
# 1. Check git
git --version || echo "❌ git not installed"

# 2. Check Docker
docker --version || echo "❌ Docker not installed"
docker info || echo "❌ Docker daemon not running or no permission"

# 3. Check Docker without sudo
docker ps || echo "❌ User not in docker group or Docker not running"

# 4. Check kubectl
kubectl version --client || echo "❌ kubectl not installed"

# 5. Check cluster access
kubectl get nodes || echo "❌ Cannot access Kubernetes cluster"

# 6. Check SSH
systemctl status sshd || systemctl status ssh || echo "❌ SSH server not running"

# 7. Check authorized_keys
test -f ~/.ssh/authorized_keys || echo "❌ No authorized_keys file"

# 8. Check git repository access
git ls-remote https://github.com/MosheHM/My-windows-XP-Portfolio.git || echo "❌ Cannot access repository"

# 9. Check firewall (optional, depending on your setup)
# Ubuntu:
sudo ufw status
# CentOS/RHEL:
sudo firewall-cmd --list-all

# 10. Check disk space
df -h
```

## Quick Reference Commands

**View deployment logs:**
```bash
kubectl logs -f deployment/portfolio-client -n portfolio
kubectl logs -f deployment/file-service -n portfolio
kubectl logs -f deployment/llm-service -n portfolio
```

**Check deployment status:**
```bash
kubectl get deployments -n portfolio
kubectl get pods -n portfolio
kubectl get services -n portfolio
```

**Restart a deployment:**
```bash
kubectl rollout restart deployment/portfolio-client -n portfolio
```

**Clean up old images:**
```bash
docker image prune -f
docker system prune -f  # More aggressive cleanup
```

**View NodePort:**
```bash
kubectl get svc client-service -n portfolio -o jsonpath='{.spec.ports[0].nodePort}'
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [kubectl Documentation](https://kubernetes.io/docs/reference/kubectl/)
- [k3s Documentation](https://docs.k3s.io/)
- [GitHub Actions SSH Documentation](https://docs.github.com/en/actions)

---

**Note:** This document should be kept up to date as the deployment requirements change. If you encounter issues not covered here, please update this document and submit a pull request.
