# Quick Start Guide

Get the Windows XP Portfolio up and running in minutes.

## Option 1: Docker Compose (Recommended for Testing)

The fastest way to run all services together:

```bash
# Clone the repository
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

# Start all services
docker-compose up --build

# Wait for services to start (LLM service takes 2-3 minutes to download model)
# Access the application at http://localhost
```

**What happens:**
- Client starts on port 80
- LLM service on port 8000 (downloads TinyLlama model ~2GB)
- File service on port 8001

**Requirements:**
- Docker and Docker Compose
- 8GB+ RAM
- 10GB+ disk space

## Option 2: Local Development

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

## Option 3: Kubernetes Deployment

For production-like environment:

```bash
# Build images
docker build -t portfolio-client:latest ./client
docker build -t llm-service:latest ./services/llm-service
docker build -t file-service:latest ./services/file-service

# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml -n portfolio
kubectl apply -f k8s/llm-service-deployment.yaml -n portfolio
kubectl apply -f k8s/file-service-deployment.yaml -n portfolio
kubectl apply -f k8s/client-deployment.yaml -n portfolio

# Check status
kubectl get pods -n portfolio

# Access via NodePort
# http://<node-ip>:30080
```

## Verification

### Check Services are Running

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
- **Production:** Use Kubernetes for scalability
- **GPU:** If available, LLM service auto-detects and uses it
- **Model size:** TinyLlama is lightweight. Can upgrade to Llama 2 or Mistral for better quality

Enjoy your Windows XP Portfolio! 🎉
