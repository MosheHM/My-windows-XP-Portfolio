# Environment Configuration Guide

This document explains the different deployment environments and how to use them.

## Overview

The project supports two distinct environments:

1. **Development** - For active development with hot reload and debugging
2. **Production** - Optimized for deployment with resource limits and security

## Environment Comparison

| Feature | Development | Production |
|---------|------------|------------|
| **Configuration File** | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| **Source Mounting** | ✅ Yes (hot reload) | ❌ No (optimized builds) |
| **Resource Limits** | ❌ No | ✅ Yes (CPU/Memory) |
| **Restart Policy** | `unless-stopped` | `always` |
| **Logging** | Verbose | Standard |
| **Container Names** | `*-dev` | `*-prod` |
| **Build Optimization** | Standard | Optimized |

## Development Environment

### Purpose
- Active development and testing
- Rapid iteration with hot reload
- Debugging and troubleshooting
- Testing new features

### Features
- Source code mounted as volumes for hot reload
- No resource limits (uses all available resources)
- Detailed logging for debugging
- Easy to start/stop individual services

### Usage

**Start Development Environment:**
```bash
# Using docker compose
docker compose -f docker-compose.dev.yml up --build

# Or using the helper script
./scripts/start-dev.sh
```

**Stop Development Environment:**
```bash
docker compose -f docker-compose.dev.yml down
```

**View Logs:**
```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f nginx-gateway
docker compose -f docker-compose.dev.yml logs -f llm-service
docker compose -f docker-compose.dev.yml logs -f file-service
docker compose -f docker-compose.dev.yml logs -f client
```

**Rebuild After Changes:**
```bash
# Rebuild all services
docker compose -f docker-compose.dev.yml up --build

# Rebuild specific service
docker compose -f docker-compose.dev.yml up --build nginx-gateway
```

### Environment Variables
Configured in `.env.development`

## Production Environment

### Purpose
- Production deployment
- Optimized performance
- Resource management
- Stability and reliability

### Features
- Optimized Docker builds (no source mounting)
- Resource limits prevent resource exhaustion
- Automatic restart on failure
- Production-grade configuration

### Resource Limits

| Service | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
|---------|-----------|--------------|-------------|----------------|
| LLM Service | 4 cores | 8GB | 2 cores | 4GB |
| File Service | 1 core | 1GB | 0.5 core | 512MB |
| Client | 0.5 core | 256MB | 0.25 core | 128MB |
| Nginx Gateway | 0.5 core | 256MB | 0.25 core | 128MB |

### Usage

**Start Production Environment:**
```bash
# Using docker compose
docker compose -f docker-compose.prod.yml up --build -d

# Or using the helper script
./scripts/start-prod.sh
```

**Stop Production Environment:**
```bash
docker compose -f docker-compose.prod.yml down
```

**View Logs:**
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f nginx-gateway
```

**Update Services:**
```bash
# Pull latest changes and rebuild
git pull
docker compose -f docker-compose.prod.yml up --build -d

# Or rebuild specific service
docker compose -f docker-compose.prod.yml up --build -d nginx-gateway
```

### Environment Variables
Configured in `.env.production`

## Nginx Gateway

Both environments use nginx as an API gateway:

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

### Benefits
- Single entry point (port 80)
- Centralized routing and load balancing
- SSL/TLS termination ready
- Security headers
- Compression and caching
- Health checks

### Accessing Services

All services are accessed through nginx gateway:

- **Application**: http://localhost/
- **LLM API**: http://localhost/api/llm/*
- **File API**: http://localhost/api/files/*
- **Health Check**: http://localhost/health

Direct service ports (8000, 8001) are no longer exposed externally.

## Switching Between Environments

### From Development to Production

1. Stop development environment:
   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

2. Start production environment:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

### From Production to Development

1. Stop production environment:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

2. Start development environment:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

## Environment Variables

### Common Variables

Both environments use the same base configuration:

```env
# LLM Service
LLM_MODEL_NAME=TinyLlama/TinyLlama-1.1B-Chat-v1.0
LLM_MAX_LENGTH=2048
LLM_TEMPERATURE=0.7

# File Service
STORAGE_PATH=/data/files
MAX_FILE_SIZE=104857600

# Client (via nginx gateway)
VITE_LLM_SERVICE_URL=/api/llm
VITE_FILE_SERVICE_URL=/api/files
```

### Environment-Specific Files

- `.env.development` - Development settings
- `.env.production` - Production settings

**Note**: These files are provided as templates. The configuration is embedded in the docker-compose files.

## Volumes

### Development Volumes

```yaml
volumes:
  - llm-model-cache:/root/.cache         # LLM model cache
  - file-storage:/data                   # File storage
  - ./services/llm-service:/app          # Source code (hot reload)
  - ./services/file-service:/app         # Source code (hot reload)
```

### Production Volumes

```yaml
volumes:
  - llm-model-cache:/root/.cache         # LLM model cache
  - llm-data:/app/data                   # LLM data
  - file-storage:/data                   # File storage
  # No source code mounting
```

## Testing the Setup

### Verify Services are Running

```bash
# Check all containers
docker ps

# Check health
curl http://localhost/health

# Check LLM service
curl http://localhost/api/llm/health

# Check file service
curl http://localhost/api/files/health
```

### Test the Application

1. **Access the UI**: http://localhost/
2. **Test Chat**: Open the Command Prompt window and send a message
3. **Test File Upload**: Use the file service API or UI

### Monitor Resources

```bash
# View resource usage
docker stats

# View container details
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.prod.yml ps
```

## Troubleshooting

### Port Conflicts

If port 80 is already in use:

```bash
# Check what's using port 80
sudo lsof -i :80

# Or on Linux
sudo netstat -tulpn | grep :80

# Kill the process or change nginx port in docker-compose
```

### Service Not Starting

```bash
# View logs
docker compose -f docker-compose.dev.yml logs service-name

# Check container status
docker ps -a

# Restart specific service
docker compose -f docker-compose.dev.yml restart service-name
```

### Out of Resources

Production environment has resource limits. If services fail:

```bash
# Check resource usage
docker stats

# Adjust limits in docker-compose.prod.yml
# Or use development environment (no limits)
```

### Network Issues

```bash
# Inspect network
docker network ls
docker network inspect my-windows-xp-portfolio_default

# Recreate network
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up
```

## Best Practices

### Development
- Use `docker-compose.dev.yml` for active development
- Mount source code for hot reload
- Use verbose logging for debugging
- Don't commit sensitive data in `.env.local` files

### Production
- Use `docker-compose.prod.yml` for deployment
- Set appropriate resource limits
- Configure monitoring and alerting
- Use SSL/TLS with proper certificates
- Implement authentication and authorization
- Regular backups of volumes
- Keep images updated with security patches

## Security Considerations

### Development
- CORS allows all origins (for local testing)
- No authentication required
- Verbose error messages
- Direct access to backend services (if needed)

### Production
- [ ] Update CORS settings to specific origins
- [ ] Implement authentication (JWT/OAuth)
- [ ] Add rate limiting
- [ ] Enable SSL/TLS
- [ ] Use secrets management
- [ ] Implement API keys
- [ ] Add logging and monitoring
- [ ] Regular security updates

## Migration Path

### Current (Legacy) → Development
```bash
# Old way
docker compose up

# New way
docker compose -f docker-compose.dev.yml up
```

### Development → Production
```bash
# Ensure all tests pass
# Update production configs if needed
# Deploy with production compose file
docker compose -f docker-compose.prod.yml up -d
```

## Additional Resources

- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [nginx/README.md](nginx/README.md) - Nginx gateway details
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Summary

Choose the right environment for your needs:

| Use Case | Environment | Command |
|----------|-------------|---------|
| Active development | Development | `docker compose -f docker-compose.dev.yml up` |
| Testing | Development | `docker compose -f docker-compose.dev.yml up -d` |
| Production deployment | Production | `docker compose -f docker-compose.prod.yml up -d` |
| Staging/QA | Production | `docker compose -f docker-compose.prod.yml up -d` |

Both environments provide a complete, working system with nginx gateway routing all requests to appropriate services.
