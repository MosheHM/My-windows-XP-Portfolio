# Windows XP Portfolio - Monorepo

A full-stack portfolio application with a Windows XP-style UI, featuring a browser-based AI chat assistant powered by Transformers.js and file storage.

## 🏗️ Architecture

This monorepo contains:

```
.
├── client/                    # React/TypeScript frontend with browser-based AI
├── services/
│   └── file-service/         # Python FastAPI file storage service
├── nginx/                    # Nginx API gateway configuration
├── systemd/                  # Systemd service files
└── scripts/                  # Deployment and utility scripts
```

### API Gateway Architecture

All requests go through an Nginx gateway that routes to appropriate services:

```
Client Request → Nginx Gateway (:80)
                     ↓
    ┌────────────────┼────────────────┐
    ↓                                 ↓
/api/files/*                         /*
    ↓                                 ↓
File Service                       Client (with browser-based AI)
  (:8001)                            (:80)
```

## 🚀 Services

### Client (Frontend)
- **Technology**: React 19, TypeScript, Vite, Transformers.js
- **Features**:
  - Windows XP-style UI
  - Browser-based AI chat assistant (Flan-T5-Small model)
  - Real-time chat with streaming simulation
  - File upload/download capabilities
  - React Query for caching
  - Runs completely in the browser - no backend AI service needed
  - Portfolio data embedded as system prompt
- **Port**: 80

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

### Systemd Deployment

The application is deployed using systemd service files to manage Docker containers.

#### Prerequisites
- Linux system with systemd
- Docker installed
- Modern browser with WebAssembly support (for browser-based AI)

#### Deploy with Systemd

```bash
# Build Docker images
cd client
docker build -t portfolio-client:latest .

cd ../services/file-service
docker build -t portfolio-file-service:latest .

cd ../../nginx
docker build -t portfolio-nginx:latest .

# Create Docker network
docker network create portfolio-network

# Install systemd services
cd ../systemd
sudo cp *.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable portfolio-client portfolio-file-service portfolio-nginx
sudo systemctl start portfolio-client portfolio-file-service portfolio-nginx

# Check status
sudo systemctl status portfolio-*
```

See the [Systemd README](systemd/README.md) for detailed deployment instructions and service management.

### Access the Application
- **Application**: http://localhost
- **File API**: http://localhost/api/files/*
- **Health Check**: http://localhost/health

**Note**: The AI chat assistant runs entirely in your browser using Transformers.js - no backend AI service needed!

## 🛠️ Local Development

### Client

```bash
cd client

# Install dependencies
npm install

# Create .env.local file (optional)
cp .env.example .env.local

# Edit .env.local if needed (defaults work fine)
# VITE_FILE_SERVICE_URL=http://localhost:8001

# Run development server
npm run dev

# Build for production
npm run build
```

**Note**: The AI chat assistant is built into the client and runs in the browser - no separate service needed!

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

## ☸️ Deployment

The application is deployed using systemd to manage Docker containers. This provides a lightweight and straightforward deployment method.

For detailed deployment instructions using systemd, see the **[Systemd README](systemd/README.md)**.

### Quick Deploy

```bash
# Build Docker images
./scripts/build-images.sh  # You can create this or build manually

# Install systemd services
cd systemd
sudo cp *.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable portfolio-*
sudo systemctl start portfolio-*

# Check status
sudo systemctl status portfolio-*
```

### Key Features

- **API Gateway**: Nginx-based gateway for routing and load balancing
- **Service Management**: Systemd for process supervision and automatic restarts
- **Persistent Storage**: Docker volumes for file storage
- **Resource Management**: Docker container resource limits
- **Health Checks**: Automatic service restart on failure

See [systemd/README.md](systemd/README.md) for complete documentation.

## 🚀 Production Deployment

This repository supports deployment to production using systemd for service management.

### Quick Setup

1. **Prepare your server**:
   ```bash
   # Install Docker if not already installed
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Clone the repository
   git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
   cd My-windows-XP-Portfolio
   ```

2. **Build and deploy:**
   ```bash
   # Build Docker images
   docker build -t portfolio-client:latest ./client
   docker build -t portfolio-file-service:latest ./services/file-service
   docker build -t portfolio-nginx:latest ./nginx
   
   # Create Docker network
   docker network create portfolio-network
   
   # Install and start systemd services
   cd systemd
   sudo cp *.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable portfolio-*
   sudo systemctl start portfolio-*
   ```

📖 **For detailed deployment instructions, see [systemd/README.md](systemd/README.md)**

## 📝 API Documentation

### AI Chat Assistant

The AI chat assistant runs entirely in the browser using Transformers.js. No API calls needed - just open the chat window and start asking questions about Moshe's professional background!

**Model**: Flan-T5-Small (~80MB)
**Context**: Portfolio data embedded as system prompt
**Streaming**: Simulated token-by-token streaming for better UX

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
- `VITE_FILE_SERVICE_URL`: File service URL (default: /api/files - via gateway)

**Note**: The AI assistant runs in the browser - no backend LLM configuration needed!

#### File Service
- `STORAGE_PATH`: File storage path (default: /data/files)
- `METADATA_PATH`: Metadata storage path (default: /data/metadata)
- `MAX_FILE_SIZE`: Max file size in bytes (default: 104857600 = 100MB)

#### Nginx Gateway
- `NGINX_PORT`: Gateway port (default: 80)

### Deployment Methods

**Systemd**:
```bash
# Build Docker images and deploy with systemd
# See systemd/README.md for details
cd systemd
sudo cp *.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable portfolio-*
sudo systemctl start portfolio-*
```

**Local Development** (individual services):
```bash
# Use the development helper script
./scripts/dev-start.sh

# This will set up and start:
# - File Service on http://localhost:8001  
# - Client on http://localhost:5173
```

## 🎯 Features

### Client Features
- ✅ Windows XP-style retro UI
- ✅ Browser-based AI chat assistant (Transformers.js)
- ✅ Real-time chat with streaming simulation
- ✅ Portfolio data embedded as system prompt
- ✅ File upload/download
- ✅ Responsive design
- ✅ API client with caching (React Query)
- ✅ TypeScript for type safety
- ✅ Runs entirely in browser - no AI backend needed!

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

- **Browser Model Cache**: ~80MB for Flan-T5-Small (downloaded on first use)
- **File Storage**: Configure based on expected usage
- **Docker Volumes**:
  - File storage: Configurable via Docker volume mounts

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally (use ./scripts/dev-start.sh for development)
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙋 Support

For issues or questions:
- Open an issue on GitHub
- Email: mhm23811@gmail.com
- LinkedIn: https://www.linkedin.com/in/moshe-haim-makias/

## 🔄 Version History

### v2.0.0 (Current)
- Migrated to browser-based AI using Transformers.js
- Removed backend LLM service for lighter deployment
- Portfolio data embedded as system prompt
- Flan-T5-Small model running in browser
- Systemd-based deployment

### v1.0.0
- Initial monorepo setup
- Backend LLM service with RAG
- File service
- Nginx gateway
