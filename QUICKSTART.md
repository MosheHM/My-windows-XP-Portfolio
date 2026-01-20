# Quick Start Guide

Get the Windows XP Portfolio up and running in minutes.

## Option 1: Systemd Deployment

Deploy to a Linux server using systemd for production-ready service management.

### Prerequisites
- Linux system with systemd
- Docker installed
- At least 4GB RAM and 10GB disk space

### Automated Deployment

```bash
# Clone the repository
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

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
sudo systemctl enable portfolio-client portfolio-file-service portfolio-nginx
sudo systemctl start portfolio-client portfolio-file-service portfolio-nginx

# Check status
sudo systemctl status portfolio-*
```

### Access the Application

Visit http://localhost (or your server's IP address)

**What's running:**
- Nginx gateway on port 80
- Client service (internal)
- File service on port 8001 (internal, accessed via gateway)

**See [systemd/README.md](systemd/README.md) for detailed documentation.**

## Option 2: Local Development

Run services individually for local development without Docker.

### Automated Setup

```bash
# Clone the repository
git clone https://github.com/MosheHM/My-windows-XP-Portfolio.git
cd My-windows-XP-Portfolio

# Run the development helper script
./scripts/dev-start.sh

# This will:
# - Set up Python virtual environments for services
# - Install all dependencies
# - Start services in separate terminals
```

### Manual Setup

#### 1. Start Backend Services

##### File Service

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

#### 2. Start Frontend

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

**What's running:**
- File Service: http://localhost:8001 (API docs at /docs)
- Client: http://localhost:5173

## Verification

### Check Services are Running

**With Systemd:**

```bash
# Check all services
sudo systemctl status portfolio-*

# Check logs
sudo journalctl -u portfolio-client -f
sudo journalctl -u portfolio-file-service -f
sudo journalctl -u portfolio-nginx -f

# Gateway health check
curl http://localhost/health

# File Service (via gateway)
curl http://localhost/api/files/health
```

**For local development (direct access):**

```bash
# File Service
curl http://localhost:8001/health

# Client (if running locally)
curl http://localhost:5173
```

### Test the Chat

1. Open the application in your browser
2. Click on the "Command Prompt" icon
3. Type a question like "Tell me about Moshe's experience"
4. You should see a streaming response (runs in browser using Transformers.js)

### Test File Upload

1. Create a test file: `echo "Test content" > test.txt`
2. Upload via API:
```bash
curl -X POST http://localhost/api/files/upload \
  -F "file=@test.txt"
```

## Troubleshooting

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

### Systemd Service Issues

**Problem:** Service won't start
- **Solution:** Check logs with `sudo journalctl -u portfolio-<service-name> -n 50`
- **Solution:** Verify Docker is running: `sudo systemctl status docker`

**Problem:** Port conflicts
- **Solution:** Ensure ports 80, 3000, and 8001 are not in use

## Next Steps

- Read the full [README.md](README.md)
- Explore [API documentation](http://localhost:8001/docs) (FastAPI auto-docs)
- Check individual service READMEs:
  - [Client](client/README.md)
  - [File Service](services/file-service/README.md)
  - [Systemd Services](systemd/README.md)

## System Requirements

### Minimum

- **CPU:** 2 cores
- **RAM:** 4GB
- **Disk:** 10GB free space
- **OS:** Linux with systemd (Ubuntu 18.04+, Debian 10+, etc.)

### Recommended

- **CPU:** 4+ cores
- **RAM:** 8GB
- **Disk:** 20GB+ free space

## Getting Help

- Check the [main README](README.md) for detailed documentation
- Review service-specific READMEs for troubleshooting
- Open an issue on GitHub
- Contact: mhm23811@gmail.com

## Development Workflow

1. **Start backend services** (via dev-start.sh or manually)
2. **Start client in dev mode** (hot reload enabled)
3. **Make changes** - client auto-reloads
4. **Test** - check chat and file operations
5. **Build** - `npm run build` in client directory
6. **Deploy** - via systemd

## Production Deployment

For production, use systemd:

1. Update CORS settings in backend services (restrict origins)
2. Add authentication/authorization
3. Use environment-specific configs
4. Set up monitoring (health checks, logs)
5. Configure backups (file storage)
6. Set up SSL/TLS certificates (configure in nginx)
7. Configure firewall rules
8. Use Docker volumes for persistent data

## Tips

- **Development:** Use `./scripts/dev-start.sh` for local development
- **Production:** Use systemd for automatic restarts and service management
- **AI Chat:** Runs entirely in browser - no backend AI service needed!
- **Browser cache:** First visit downloads AI model (~80MB), subsequent visits are instant

Enjoy your Windows XP Portfolio! 🎉
