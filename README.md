# Windows XP Portfolio - Monorepo

A full-stack portfolio application with a Windows XP-style UI, featuring a local LLM chat service with RAG capabilities and file storage.

## 🏗️ Architecture

This monorepo contains:

```
.
├── client/                 # React/TypeScript frontend
├── services/
│   ├── llm-service/       # Python FastAPI LLM service with RAG
│   └── file-service/      # Python FastAPI file storage service
├── k8s/                   # Kubernetes manifests
└── docker-compose.yml     # Local development setup
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

## 🐳 Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- At least 8GB RAM available for LLM service
- 10GB+ free disk space for model downloads

### Run All Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Access the Application
- **Client**: http://localhost
- **LLM Service**: http://localhost:8000
- **File Service**: http://localhost:8001
- **API Docs (LLM)**: http://localhost:8000/docs
- **API Docs (File)**: http://localhost:8001/docs

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

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured
- Docker images built and available

### Build Docker Images

```bash
# Build client image
cd client
docker build -t portfolio-client:latest .

# Build LLM service image
cd ../services/llm-service
docker build -t llm-service:latest .

# Build file service image
cd ../file-service
docker build -t file-service:latest .
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml -n portfolio

# Deploy services
kubectl apply -f k8s/llm-service-deployment.yaml -n portfolio
kubectl apply -f k8s/file-service-deployment.yaml -n portfolio
kubectl apply -f k8s/client-deployment.yaml -n portfolio

# Check status
kubectl get pods -n portfolio
kubectl get services -n portfolio

# Access the application
# The client is exposed via NodePort on port 30080
# Access at: http://<node-ip>:30080
```

### Useful Commands

```bash
# View logs
kubectl logs -f deployment/llm-service -n portfolio
kubectl logs -f deployment/file-service -n portfolio
kubectl logs -f deployment/portfolio-client -n portfolio

# Scale services
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio

# Port forward for testing
kubectl port-forward service/llm-service 8000:8000 -n portfolio
kubectl port-forward service/file-service 8001:8001 -n portfolio

# Delete all resources
kubectl delete namespace portfolio
```

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

### Environment Variables

#### Client
- `VITE_LLM_SERVICE_URL`: LLM service URL (default: http://localhost:8000)
- `VITE_FILE_SERVICE_URL`: File service URL (default: http://localhost:8001)

#### LLM Service
- `LLM_MODEL_NAME`: HuggingFace model name (default: TinyLlama/TinyLlama-1.1B-Chat-v1.0)
- `LLM_MAX_LENGTH`: Max token length (default: 2048)
- `LLM_TEMPERATURE`: Generation temperature (default: 0.7)
- `RAG_DATA_FILE`: Path to resume data JSON (default: data/resume_data.json)

#### File Service
- `STORAGE_PATH`: File storage path (default: /data/files)
- `METADATA_PATH`: Metadata storage path (default: /data/metadata)
- `MAX_FILE_SIZE`: Max file size in bytes (default: 104857600 = 100MB)

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
3. Test locally with docker-compose
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
- Kubernetes manifests
- Docker Compose setup
