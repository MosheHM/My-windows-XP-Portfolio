# Quick Start Guide

Get the Windows XP Portfolio up and running in minutes.

## Option 1: Kubernetes (Recommended)

The recommended way to deploy for production-ready infrastructure with scalability and high availability.

### Automated Deployment

```bash
# Clone the repository
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

# Run the automated deployment script
./scripts/deploy-k8s.sh

# Follow the prompts to build images (optional) and deploy
# The script will show you how to access the application
```

### Manual Deployment

```bash
# Using Kustomize (easiest)
kubectl apply -k k8s/

# Or deploy manually
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml -n portfolio
kubectl apply -f k8s/llm-service-deployment.yaml -n portfolio
kubectl apply -f k8s/file-service-deployment.yaml -n portfolio
kubectl apply -f k8s/client-deployment.yaml -n portfolio
kubectl apply -f k8s/nginx-gateway-deployment.yaml -n portfolio

# Check status
kubectl get pods -n portfolio

# Access the application via port-forward
kubectl port-forward service/nginx-gateway 8080:80 -n portfolio
# Visit http://localhost:8080
```

**What happens:**
- Nginx gateway deployed with 2 replicas (NodePort on 30080)
- Client deployed with 2 replicas
- LLM service with persistent model cache (10Gi PVC)
- File service with 2 replicas and persistent storage (20Gi PVC)
- All services communicate through the nginx gateway

**Requirements:**
- Kubernetes cluster (minikube, kind, GKE, EKS, AKS, etc.)
- kubectl configured
- 8GB+ RAM available for the cluster
- 30GB+ storage for PVCs

**See [k8s/README.md](k8s/README.md) for detailed documentation.**

## Option 2: Docker Compose (Development/Testing)

Good for local development and testing. Kubernetes is recommended for production.

### Development Environment

```bash
# Clone the repository
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Wait for services to start (LLM service takes 2-3 minutes to download model)
# Access the application at http://localhost
```

### Production Environment

```bash
# Start all services in production mode
docker-compose -f docker-compose.prod.yml up --build -d

# Access the application at http://localhost
```

**What happens:**
- Nginx gateway starts on port 80 (single entry point)
- Client accessible via nginx at http://localhost/
- LLM API accessible at http://localhost/api/llm/
- File API accessible at http://localhost/api/files/
- LLM service downloads TinyLlama model (~2GB on first run)

**Requirements:**
- Docker and Docker Compose
- 8GB+ RAM
- 10GB+ disk space

**Key Differences:**
- **Development**: Source code mounted for hot reload, detailed logging
- **Production**: Optimized builds, resource limits, no source mounting

## Option 3: Local Development

Run services individually for development:

### 1. Start Backend Services

#### LLM Service

```bash
cd services/llm-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies (this will download PyTorch and transformers)
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

First run downloads the TinyLlama model (~2GB). Subsequent runs are instant.

#### File Service

```bash
cd services/file-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Start Frontend

```bash
cd client

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

Access at http://localhost:5173

## Verification

### Check Services are Running

**With Kubernetes:**

```bash
# Check all pods
kubectl get pods -n portfolio

# Gateway health check (via port-forward)
kubectl port-forward service/nginx-gateway 8080:80 -n portfolio &
curl http://localhost:8080/health

# LLM Service (via gateway)
curl http://localhost:8080/api/llm/health

# File Service (via gateway)
curl http://localhost:8080/api/files/health
```

**With Docker Compose (nginx gateway):**

```bash
# Gateway health check
curl http://localhost/health

# LLM Service (via gateway)
curl http://localhost/api/llm/health

# File Service (via gateway)
curl http://localhost/api/files/health

# Client
curl http://localhost/
```

**For local development (without gateway):**

```bash
# LLM Service
curl http://localhost:8000/health

# File Service
curl http://localhost:8001/health

# Client (if running locally)
curl http://localhost:5173
```

### Test the Chat

1. Open the application in your browser
2. Click on the "Command Prompt" icon
3. Type a question like "Tell me about Moshe's experience"
4. You should see a streaming response

### Test File Upload

1. Create a test file: `echo "Test content" > test.txt`
2. Upload via API:
```bash
curl -X POST http://localhost:8001/upload \
  -F "file=@test.txt"
```

## Troubleshooting

### LLM Service Issues

**Problem:** Out of memory
- **Solution:** Use a machine with at least 8GB RAM or close other applications

**Problem:** Model download fails
- **Solution:** Check internet connection, model downloads to `~/.cache/huggingface/`

**Problem:** Slow responses
- **Solution:** First response is slower (model loading). Subsequent responses are faster.

### Client Issues

**Problem:** Can't connect to backend
- **Solution:** Check `.env.local` has correct URLs
- **Solution:** Ensure backend services are running

**Problem:** CORS errors
- **Solution:** Backend CORS is configured for all origins. If still seeing errors, check browser console.

### File Service Issues

**Problem:** Upload fails
- **Solution:** Check file size is under 100MB (default limit)
- **Solution:** Ensure storage directory has write permissions

## Next Steps

- Read the full [README.md](README.md)
- Explore [API documentation](http://localhost:8000/docs) (FastAPI auto-docs)
- Check individual service READMEs:
  - [Client](client/README.md)
  - [LLM Service](services/llm-service/README.md)
  - [File Service](services/file-service/README.md)
  - [Kubernetes](k8s/README.md)

## System Requirements

### Minimum

- **CPU:** 2 cores
- **RAM:** 4GB (8GB recommended)
- **Disk:** 10GB free space
- **OS:** Linux, macOS, or Windows with WSL2

### Recommended

- **CPU:** 4+ cores
- **RAM:** 16GB
- **Disk:** 20GB+ free space
- **GPU:** NVIDIA GPU with CUDA for faster inference (optional)

## Getting Help

- Check the [main README](README.md) for detailed documentation
- Review service-specific READMEs for troubleshooting
- Open an issue on GitHub
- Contact: mhm23811@gmail.com

## Development Workflow

1. **Start backend services** (once)
2. **Start client in dev mode** (hot reload enabled)
3. **Make changes** - client auto-reloads
4. **Test** - check chat and file operations
5. **Build** - `npm run build` in client directory
6. **Deploy** - via Docker or Kubernetes

## Production Deployment

For production:

1. Update CORS settings in backend services (restrict origins)
2. Add authentication/authorization
3. Use environment-specific configs
4. Set up monitoring (health checks, logs)
5. Configure backups (file storage, model cache)
6. Use reverse proxy (nginx, Traefik)
7. Set up SSL/TLS certificates
8. Scale services based on load

## Tips

- **First run:** LLM service downloads model (~2-3 minutes)
- **Subsequent runs:** Much faster (model is cached)
- **Development:** Use docker-compose for quick iteration
- **Production:** Use Kubernetes for scalability and high availability
- **Staging/Testing:** Kubernetes recommended for production-like environment
- **GPU:** If available, LLM service auto-detects and uses it
- **Model size:** TinyLlama is lightweight. Can upgrade to Llama 2 or Mistral for better quality

## Deployment Comparison

| Feature | Kubernetes | Docker Compose | Local Dev |
|---------|-----------|----------------|-----------|
| **Best for** | Production | Dev/Testing | Development |
| **Scalability** | ✅ Excellent | ❌ Limited | ❌ None |
| **High Availability** | ✅ Built-in | ❌ None | ❌ None |
| **Resource Management** | ✅ Full control | ⚠️ Basic | ❌ Manual |
| **Setup Complexity** | ⚠️ Moderate | ✅ Easy | ✅ Easy |
| **Rolling Updates** | ✅ Zero downtime | ❌ Requires restart | ❌ Manual |
| **Load Balancing** | ✅ Automatic | ❌ None | ❌ None |

Enjoy your Windows XP Portfolio! 🎉
