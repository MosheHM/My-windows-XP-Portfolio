# Project Structure

Complete overview of the Windows XP Portfolio monorepo structure.

## Directory Layout

```
.
├── client/                          # React TypeScript frontend
│   ├── components/                  # React components
│   │   ├── windows/                # Window components
│   │   │   ├── ChatWindow.tsx      # Chat interface with streaming
│   │   │   ├── AboutMeWindow.tsx   # About section
│   │   │   ├── ProjectsWindow.tsx  # Projects showcase
│   │   │   ├── ResumeWindow.tsx    # Resume viewer
│   │   │   └── ...
│   │   ├── Desktop.tsx             # Desktop component
│   │   ├── Taskbar.tsx             # Windows taskbar
│   │   ├── Window.tsx              # Base window component
│   │   └── DesktopIcon.tsx         # Desktop icon component
│   ├── context/                    # React context
│   │   └── WindowsContext.tsx      # Window management state
│   ├── hooks/                      # Custom React hooks
│   │   └── useDraggable.ts         # Draggable window hook
│   ├── services/                   # API services
│   │   ├── apiClient.ts            # Axios setup and configuration
│   │   ├── chatService.ts          # LLM chat API with SSE
│   │   ├── fileService.ts          # File upload/download API
│   │   └── geminiService.ts        # Legacy Gemini service (deprecated)
│   ├── App.tsx                     # Root application component
│   ├── index.tsx                   # Application entry point
│   ├── constants.ts                # Constants and static data
│   ├── types.ts                    # TypeScript type definitions
│   ├── index.html                  # HTML template
│   ├── package.json                # Node.js dependencies
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   ├── Dockerfile                  # Docker build instructions
│   ├── nginx.conf                  # Nginx server configuration
│   ├── .env.example                # Environment variables template
│   ├── .dockerignore               # Docker build exclusions
│   └── README.md                   # Client documentation
│
├── services/                        # Backend microservices
│   ├── llm-service/                # LLM chat service
│   │   ├── main.py                 # FastAPI application
│   │   ├── llm_handler.py          # LLaMA model handler
│   │   ├── rag_engine.py           # RAG with FAISS
│   │   ├── requirements.txt        # Python dependencies
│   │   ├── Dockerfile              # Docker build instructions
│   │   ├── .dockerignore           # Docker build exclusions
│   │   ├── data/                   # Data directory
│   │   │   └── resume_data.json    # RAG source data
│   │   └── README.md               # Service documentation
│   │
│   └── file-service/               # File storage service
│       ├── main.py                 # FastAPI application
│       ├── requirements.txt        # Python dependencies
│       ├── Dockerfile              # Docker build instructions
│       ├── .dockerignore           # Docker build exclusions
│       └── README.md               # Service documentation
│
├── k8s/                            # Kubernetes manifests
│   ├── namespace.yaml              # Portfolio namespace
│   ├── configmap.yaml              # Configuration values
│   ├── client-deployment.yaml      # Client deployment & service
│   ├── llm-service-deployment.yaml # LLM deployment, service & PVC
│   ├── file-service-deployment.yaml# File deployment, service & PVC
│   └── README.md                   # Kubernetes guide
│
├── scripts/                        # Automation scripts
│   ├── deploy-k8s.sh              # Kubernetes deployment script
│   └── dev-start.sh               # Local development starter
│
├── docker-compose.yml              # Local development with Docker
├── README.md                       # Main documentation
├── QUICKSTART.md                   # Quick start guide
├── CONTRIBUTING.md                 # Contribution guidelines
├── PROJECT_STRUCTURE.md            # This file
├── .gitignore                      # Git exclusions
└── metadata.json                   # Project metadata

```

## Component Breakdown

### Client (Frontend)

**Technology Stack:**
- React 19 with TypeScript
- Vite for build tooling
- Axios for HTTP requests
- React Query for caching
- Tailwind CSS (implicit in components)

**Key Features:**
- Windows XP retro UI theme
- Draggable, resizable windows
- Real-time chat with streaming
- File management interface
- Responsive design

**Build Output:**
- Static files in `dist/`
- Served via Nginx in production
- Size: ~260KB (gzipped: ~85KB)

### LLM Service (Backend)

**Technology Stack:**
- Python 3.11+
- FastAPI framework
- PyTorch for model execution
- Transformers (HuggingFace)
- FAISS for vector search
- Sentence Transformers for embeddings

**Key Features:**
- Local LLaMA model execution
- RAG with semantic search
- Streaming responses via SSE
- GPU/CPU auto-detection
- Document indexing

**Resources:**
- Memory: 4-8GB
- CPU: 2-4 cores
- Storage: 10GB (model cache)

### File Service (Backend)

**Technology Stack:**
- Python 3.11+
- FastAPI framework

**Key Features:**
- File upload/download
- Streaming file transfers
- Metadata management
- Multiple file support

**Resources:**
- Memory: 256-512MB
- CPU: 200-500m
- Storage: Configurable PVC

## Data Flow

### Chat Interaction

```
User Input (Client)
    ↓
ChatWindow Component
    ↓
chatService.sendChatMessageStream()
    ↓
HTTP POST /chat/stream (SSE)
    ↓
LLM Service main.py
    ↓
llm_handler.generate_stream()
    ├→ rag_engine.search() (get context)
    └→ Model inference
    ↓
SSE tokens streamed back
    ↓
Client displays in real-time
```

### File Upload

```
User selects file (Client)
    ↓
fileService.uploadFile()
    ↓
HTTP POST /upload (multipart)
    ↓
File Service main.py
    ├→ Validate file
    ├→ Generate UUID
    ├→ Save to storage
    └→ Save metadata
    ↓
Return file metadata
    ↓
Client displays confirmation
```

## API Endpoints

### LLM Service (Port 8000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/chat` | POST | Non-streaming chat |
| `/chat/stream` | POST | Streaming chat (SSE) |
| `/rag/index` | POST | Index documents |
| `/rag/search` | GET | Search documents |

### File Service (Port 8001)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/upload` | POST | Upload single file |
| `/upload/multiple` | POST | Upload multiple files |
| `/download/{id}` | GET | Download file |
| `/stream/{id}` | GET | Stream file |
| `/metadata/{id}` | GET | Get file metadata |
| `/list` | GET | List files |
| `/delete/{id}` | DELETE | Delete file |

## Environment Variables

### Client

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_LLM_SERVICE_URL` | `http://localhost:8000` | LLM service URL |
| `VITE_FILE_SERVICE_URL` | `http://localhost:8001` | File service URL |

### LLM Service

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODEL_NAME` | `TinyLlama/TinyLlama-1.1B-Chat-v1.0` | HuggingFace model |
| `LLM_MAX_LENGTH` | `2048` | Max token length |
| `LLM_TEMPERATURE` | `0.7` | Generation temperature |
| `RAG_DATA_FILE` | `data/resume_data.json` | RAG data source |

### File Service

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PATH` | `/data/files` | File storage path |
| `METADATA_PATH` | `/data/metadata` | Metadata path |
| `MAX_FILE_SIZE` | `104857600` | Max file size (bytes) |

## Deployment Options

### 1. Docker Compose (Development)

**Pros:**
- Easy setup
- All services in one command
- Good for testing

**Cons:**
- Not production-ready
- Limited scaling

**Usage:**
```bash
docker-compose up
```

### 2. Local Development (Development)

**Pros:**
- Fast iteration
- Hot reload
- Easy debugging

**Cons:**
- Manual setup
- Multiple terminals

**Usage:**
```bash
./scripts/dev-start.sh
```

### 3. Kubernetes (Production)

**Pros:**
- Production-ready
- Auto-scaling
- High availability
- Resource management

**Cons:**
- Complex setup
- Requires cluster

**Usage:**
```bash
./scripts/deploy-k8s.sh
```

## Storage Requirements

| Component | Development | Production |
|-----------|-------------|------------|
| LLM Model Cache | 5-10GB | 10GB (PVC) |
| File Storage | 1-5GB | 20GB (PVC) |
| Client Build | 1MB | N/A (static) |
| Python Packages | 500MB | N/A (in image) |
| Node Modules | 100MB | N/A (build only) |

## Network Architecture

### Local Development

```
Client (localhost:5173)
    ↓
LLM Service (localhost:8000)
File Service (localhost:8001)
```

### Docker Compose

```
Client (localhost:80)
    ↓ (Docker network)
llm-service:8000
file-service:8001
```

### Kubernetes

```
Client NodePort (30080)
    ↓ (Kubernetes service mesh)
llm-service ClusterIP (8000)
file-service ClusterIP (8001)
    ↓
Pods (with PVCs)
```

## Security Considerations

**Current State:**
- CORS allows all origins (development)
- No authentication
- No rate limiting
- Basic file validation

**Production Recommendations:**
- [ ] Add authentication (JWT/OAuth)
- [ ] Restrict CORS origins
- [ ] Implement rate limiting
- [ ] Add file type validation
- [ ] Enable HTTPS/TLS
- [ ] Add API keys
- [ ] Implement logging/monitoring
- [ ] Add input sanitization
- [ ] Enable security headers

## Performance Metrics

### LLM Service
- First response: 2-5 seconds (model loading)
- Subsequent responses: 1-2 seconds (CPU), <1 second (GPU)
- Memory usage: 2-4GB (TinyLlama), 12-16GB (7B models)

### File Service
- Upload: Depends on file size and network
- Download: Streaming available for large files
- Memory usage: 256-512MB

### Client
- Build time: 1-2 seconds
- First Contentful Paint: <1 second
- Time to Interactive: <2 seconds

## Monitoring

**Health Checks:**
- All services expose `/health` endpoint
- Kubernetes liveness/readiness probes
- HTTP 200 = healthy

**Logs:**
- FastAPI automatic logging
- Console output in development
- Kubernetes logs in production

**Metrics:**
- Response times
- Error rates
- Resource usage (CPU/memory)

## Future Enhancements

- [ ] Add authentication layer
- [ ] Implement user profiles
- [ ] Add CI/CD pipeline
- [ ] Automated testing
- [ ] Monitoring dashboard
- [ ] Multiple LLM backends
- [ ] File versioning
- [ ] WebSocket support
- [ ] Mobile app version
