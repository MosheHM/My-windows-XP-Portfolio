# Windows XP Portfolio - Monorepo

A full-stack portfolio application with a Windows XP-style UI, featuring a local LLM chat service with RAG capabilities and file storage.

## 🏗️ Architecture

This monorepo contains:

```
.
├── client/                    # React/TypeScript frontend
├── services/
│   ├── llm-service/          # Python FastAPI LLM service with RAG
│   └── file-service/         # Python FastAPI file storage service
├── nginx/                    # Nginx API gateway configuration
├── k8s/                      # Kubernetes manifests
└── scripts/                  # Deployment and utility scripts
```

### API Gateway Architecture

All requests go through an Nginx gateway that routes to appropriate services:

```
Client Request → Nginx Gateway (:80)
                     ↓
    ┌────────────────┼────────────────┐
    ↓                ↓                ↓
/api/llm/*      /api/files/*        /*
    ↓                ↓                ↓
LLM Service    File Service      Client
  (:8000)         (:8001)         (:80)
```

## 🚀 Services

### Client (Frontend)
- **Technology**: React 19, TypeScript, Vite
- **Features**:
  - Windows XP-style UI
  - Real-time chat with streaming support
  - File upload/download capabilities
  - React Query for caching
  - Axios for HTTP requests with SSE support
- **Port**: 80

### LLM Service (Backend)
- **Technology**: Python, FastAPI, PyTorch, Transformers
- **Features**:
  - Local LLaMA model (TinyLlama by default)
  - RAG (Retrieval-Augmented Generation) with FAISS
  - Streaming responses via Server-Sent Events
  - Sentence transformers for embeddings
- **Port**: 8000

### File Service (Backend)
- **Technology**: Python, FastAPI
- **Features**:
  - File upload/download
  - Streaming file transfers
  - Metadata storage
  - Multiple file upload support
- **Port**: 8001

### Nginx Gateway
- **Technology**: Nginx
- **Features**:
  - Reverse proxy for all services
  - API routing (/api/llm, /api/files)
  - SSL/TLS ready
  - Compression and caching
  - Security headers
  - Health checks
- **Port**: 80

## 🚀 Quick Start

### Kubernetes Deployment

Kubernetes is the deployment method for this application, providing scalability, high availability, and production-ready features.

#### Prerequisites
- Kubernetes cluster (minikube, kind, GKE, EKS, AKS, etc.)
- kubectl configured to access your cluster
- At least 8GB RAM available for the LLM service
- 10GB+ free disk space for model downloads

#### Deploy to Kubernetes

```bash
# Automated deployment (recommended)
./scripts/deploy-k8s.sh

# Or using Kustomize
kubectl apply -k k8s/

# Or manual deployment
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml -n portfolio
kubectl apply -f k8s/llm-service-deployment.yaml -n portfolio
kubectl apply -f k8s/file-service-deployment.yaml -n portfolio
kubectl apply -f k8s/client-deployment.yaml -n portfolio
kubectl apply -f k8s/nginx-gateway-deployment.yaml -n portfolio

# Check status
kubectl get pods -n portfolio

# Access the application
kubectl port-forward service/nginx-gateway 8080:80 -n portfolio
# Then visit http://localhost:8080
```

See the [Kubernetes README](k8s/README.md) for detailed deployment instructions, troubleshooting, and production best practices.

### Access the Application
- **Application**: http://localhost:8080 (K8s port-forward) or http://<node-ip>:30080 (NodePort)
- **LLM API**: http://localhost:8080/api/llm/*
- **File API**: http://localhost:8080/api/files/*
- **Health Check**: http://localhost:8080/health

**Note**: All services are accessed through the Nginx gateway. Direct service ports (8000, 8001) are not exposed externally.

## 🛠️ Local Development

### Client

```bash
cd client

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your service URLs
# VITE_LLM_SERVICE_URL=http://localhost:8000
# VITE_FILE_SERVICE_URL=http://localhost:8001

# Run development server
npm run dev

# Build for production
npm run build
```

### LLM Service

```bash
cd services/llm-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### File Service

```bash
cd services/file-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## ☸️ Kubernetes Deployment

Kubernetes is the **recommended deployment method** for this application. It provides scalability, high availability, and production-ready features.

For detailed Kubernetes deployment instructions, troubleshooting, and best practices, see the **[Kubernetes README](k8s/README.md)**.

### Quick Deploy

```bash
# Automated deployment (easiest method)
./scripts/deploy-k8s.sh

# Or using Kustomize
kubectl apply -k k8s/

# Access the application
kubectl port-forward service/nginx-gateway 8080:80 -n portfolio
# Visit http://localhost:8080
```

### Key Features

- **API Gateway**: Nginx-based gateway for routing and load balancing
- **High Availability**: Multiple replicas for client and file service
- **Persistent Storage**: Dedicated PVCs for model cache and file storage
- **Resource Management**: CPU and memory limits/requests
- **Health Checks**: Liveness and readiness probes
- **Scalability**: Easy horizontal scaling with kubectl

See [k8s/README.md](k8s/README.md) for complete documentation.

## 🚀 Production Deployment (Auto-Deploy with Kubernetes)

This repository is configured with GitHub Actions for automatic deployment to production using Kubernetes.

### Quick Setup

1. **Prepare your server** (Ubuntu/Debian at 129.159.130.84):
   ```bash
   # Copy and run the setup script on your server
   # This installs Docker, kubectl, and k3s (lightweight Kubernetes)
   ./scripts/setup-server.sh
   ```

2. **Configure GitHub Secrets:**
   - `SSH_PRIVATE_KEY` - Your SSH private key for server access
   - `SERVER_IP` - Your server IP (129.159.130.84)
   - `SERVER_USER` - SSH username (e.g., ubuntu)
   - `DOMAIN` - Your domain (moshe-makies.dev)

3. **Deploy:**
   ```bash
   # Automatic: Push to main branch
   git push origin main
   
   # Manual: Use deployment script
   ./scripts/deploy-remote.sh
   ```

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## 📝 API Documentation

### LLM Service API

**POST /chat**
```json
{
  "message": "Tell me about Moshe's experience",
  "history": [],
  "use_rag": true
}
```

**POST /chat/stream**
Streaming endpoint with Server-Sent Events

**GET /health**
Health check endpoint

**POST /rag/index**
Index documents for RAG

**GET /rag/search?query=experience&top_k=5**
Search RAG index

### File Service API

**POST /upload**
Upload a single file (multipart/form-data)

**POST /upload/multiple**
Upload multiple files

**GET /download/{file_id}**
Download a file

**GET /stream/{file_id}**
Stream a file

**GET /metadata/{file_id}**
Get file metadata

**GET /list?skip=0&limit=100**
List all files

**DELETE /delete/{file_id}**
Delete a file

**GET /health**
Health check endpoint

## 🔧 Configuration

### Environment Files

The project supports separate environment configurations:

- `.env.development` - Development environment settings
- `.env.production` - Production environment settings

### Environment Variables

#### Client
- `VITE_LLM_SERVICE_URL`: LLM service URL (default: /api/llm - via gateway)
- `VITE_FILE_SERVICE_URL`: File service URL (default: /api/files - via gateway)

**Note**: With the nginx gateway, services are accessed via `/api/*` paths instead of direct ports.

#### LLM Service
- `LLM_MODEL_NAME`: HuggingFace model name (default: TinyLlama/TinyLlama-1.1B-Chat-v1.0)
- `LLM_MAX_LENGTH`: Max token length (default: 2048)
- `LLM_TEMPERATURE`: Generation temperature (default: 0.7)
- `RAG_DATA_FILE`: Path to resume data JSON (default: data/resume_data.json)

#### File Service
- `STORAGE_PATH`: File storage path (default: /data/files)
- `METADATA_PATH`: Metadata storage path (default: /data/metadata)
- `MAX_FILE_SIZE`: Max file size in bytes (default: 104857600 = 100MB)

#### Nginx Gateway
- `NGINX_PORT`: Gateway port (default: 80)

### Deployment Methods

**Kubernetes**:
```bash
# Deploy to Kubernetes cluster
./scripts/deploy-k8s.sh

# Or using Kustomize
kubectl apply -k k8s/
```

**Local Development** (individual services):
```bash
# Use the development helper script
./scripts/dev-start.sh

# This will set up and start:
# - LLM Service on http://localhost:8000
# - File Service on http://localhost:8001  
# - Client on http://localhost:5173
```

## 🎯 Features

### Client Features
- ✅ Windows XP-style retro UI
- ✅ Real-time chat with streaming responses
- ✅ File upload/download
- ✅ Responsive design
- ✅ API client with caching (React Query)
- ✅ TypeScript for type safety

### LLM Service Features
- ✅ Local LLaMA model execution
- ✅ RAG with FAISS vector store
- ✅ Streaming responses via SSE
- ✅ Document indexing
- ✅ Semantic search
- ✅ CPU and GPU support

### File Service Features
- ✅ File upload/download
- ✅ Streaming file transfers
- ✅ Metadata management
- ✅ Multiple file upload
- ✅ File listing and deletion

## 🔒 Security Considerations

⚠️ **Important**: The current CORS configuration allows all origins. Update this for production:

```python
# In main.py for both services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📦 Storage Requirements

- **LLM Model Cache**: ~5-10GB for TinyLlama model
- **File Storage**: Configure based on expected usage
- **Kubernetes PVCs**:
  - LLM model cache: 10Gi (ReadWriteOnce)
  - File storage: 20Gi (ReadWriteMany)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally (use ./scripts/dev-start.sh or deploy to K8s)
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙋 Support

For issues or questions:
- Open an issue on GitHub
- Email: mhm23811@gmail.com
- LinkedIn: https://www.linkedin.com/in/moshe-haim-makias/

## 🔄 Version History

### v1.0.0 (Current)
- Initial monorepo setup
- LLM service with RAG
- File service
- Kubernetes deployment with nginx gateway
