# Migration Guide: Legacy to Environment-Based Setup

This guide helps you migrate from the legacy single `docker-compose.yml` to the new environment-based setup with nginx gateway.

## What Changed?

### Before (Legacy Setup)

```bash
# Single docker-compose file
docker-compose up

# Direct port access
Client:      http://localhost:80
LLM API:     http://localhost:8000
File API:    http://localhost:8001
```

**Issues with legacy setup:**
- No environment separation
- No centralized gateway
- Direct service exposure
- No production optimizations
- Mixed concerns (dev and prod in one file)

### After (New Setup)

```bash
# Environment-specific compose files
docker compose -f docker-compose.dev.yml up    # Development
docker compose -f docker-compose.prod.yml up   # Production

# Single entry point via nginx gateway
Application: http://localhost/
LLM API:     http://localhost/api/llm/
File API:    http://localhost/api/files/
Health:      http://localhost/health
```

**Benefits of new setup:**
- ✅ Environment separation (dev/prod)
- ✅ Nginx gateway (single entry point)
- ✅ Better security architecture
- ✅ Production-ready resource limits
- ✅ Development hot reload support
- ✅ SSL/TLS ready
- ✅ Simplified deployment

## Migration Steps

### Step 1: Stop Legacy Setup

If you're currently running the old setup:

```bash
# Stop all services
docker-compose down

# Optional: Remove old volumes (only if you want a fresh start)
docker volume prune
```

### Step 2: Update Your Configuration

The new setup uses environment files:

**Development**: `.env.development`
```env
VITE_LLM_SERVICE_URL=/api/llm
VITE_FILE_SERVICE_URL=/api/files
```

**Production**: `.env.production`
```env
VITE_LLM_SERVICE_URL=/api/llm
VITE_FILE_SERVICE_URL=/api/files
```

**Note**: Configuration is embedded in docker-compose files, so you don't need to manually edit these.

### Step 3: Choose Your Environment

#### For Development (Hot Reload)

```bash
# Using docker compose
docker compose -f docker-compose.dev.yml up --build

# Or using helper script
./scripts/start-dev.sh
```

**Features:**
- Source code mounted for hot reload
- Verbose logging
- No resource limits
- Container names end with `-dev`

#### For Production (Optimized)

```bash
# Using docker compose
docker compose -f docker-compose.prod.yml up --build -d

# Or using helper script
./scripts/start-prod.sh
```

**Features:**
- Optimized builds
- Resource limits configured
- Automatic restart policies
- Container names end with `-prod`

### Step 4: Update Client Application Configuration

If you have a local `.env.local` file in the client directory:

**Before:**
```env
VITE_LLM_SERVICE_URL=http://localhost:8000
VITE_FILE_SERVICE_URL=http://localhost:8001
```

**After:**
```env
VITE_LLM_SERVICE_URL=/api/llm
VITE_FILE_SERVICE_URL=/api/files
```

### Step 5: Update API Calls (If Applicable)

If you have custom scripts or tests calling the API directly:

**Before:**
```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
```

**After:**
```bash
curl http://localhost/api/llm/health
curl http://localhost/api/files/health
```

## Architecture Changes

### Network Flow

**Before:**
```
Client → http://localhost:80
LLM Service → http://localhost:8000
File Service → http://localhost:8001
```

**After:**
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

### Service Communication

**Before:**
- Services accessed directly via exposed ports
- No centralized routing
- Client hardcoded with service URLs

**After:**
- All requests go through nginx gateway
- Centralized routing and load balancing
- Client uses relative paths (/api/*)

## Feature Comparison

| Feature | Legacy | Development | Production |
|---------|--------|-------------|------------|
| **Environment** | Mixed | Dev-focused | Prod-optimized |
| **Hot Reload** | ❌ No | ✅ Yes | ❌ No |
| **Resource Limits** | ❌ No | ❌ No | ✅ Yes |
| **Nginx Gateway** | ❌ No | ✅ Yes | ✅ Yes |
| **Restart Policy** | unless-stopped | unless-stopped | always |
| **SSL/TLS Ready** | ❌ No | ✅ Yes | ✅ Yes |
| **Security Headers** | ❌ No | ✅ Yes | ✅ Yes |
| **Compression** | Partial | ✅ Yes | ✅ Yes |
| **Health Checks** | Basic | ✅ Enhanced | ✅ Enhanced |

## Volume Migration

Volumes remain the same, so your data is preserved:

- `llm-model-cache` - LLM model cache (shared)
- `file-storage` - File storage (shared)

New production volume:
- `llm-data` - LLM service data (prod only)

**To migrate existing volumes:**

```bash
# List existing volumes
docker volume ls | grep portfolio

# Volumes are automatically reused with the same names
# No manual migration needed
```

## Port Changes

**Legacy ports:**
- 80: Client
- 8000: LLM Service (exposed)
- 8001: File Service (exposed)

**New setup:**
- 80: Nginx Gateway (only exposed port)
- 8000: LLM Service (internal only)
- 8001: File Service (internal only)

**Benefits:**
- Reduced attack surface (fewer exposed ports)
- Centralized security control
- Easier to secure with SSL/TLS

## Testing Your Migration

### 1. Verify Services are Running

```bash
# Check all containers
docker ps

# Should see:
# - nginx-gateway-dev (or prod)
# - llm-service-dev (or prod)
# - file-service-dev (or prod)
# - client-dev (or prod)
```

### 2. Test Health Endpoints

```bash
# Gateway health
curl http://localhost/health

# LLM service health
curl http://localhost/api/llm/health

# File service health
curl http://localhost/api/files/health
```

### 3. Test the Application

1. Open http://localhost/ in your browser
2. Test the chat functionality
3. Test file upload/download
4. Verify streaming works

### 4. Check Logs

```bash
# Development
docker compose -f docker-compose.dev.yml logs -f

# Production
docker compose -f docker-compose.prod.yml logs -f
```

## Rollback (If Needed)

If you need to rollback to the legacy setup:

```bash
# Stop new setup
docker compose -f docker-compose.dev.yml down

# Start legacy setup
docker-compose up
```

**Note**: The legacy `docker-compose.yml` is still available but marked as deprecated.

## Common Issues

### Issue: Port 80 already in use

**Solution:**
```bash
# Find what's using port 80
sudo lsof -i :80

# Stop the conflicting service or change nginx port
```

### Issue: Services can't reach each other

**Solution:**
```bash
# Recreate the network
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up
```

### Issue: Old containers conflicting

**Solution:**
```bash
# Remove all containers
docker compose down
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.prod.yml down

# Start fresh
docker compose -f docker-compose.dev.yml up --build
```

### Issue: Client can't reach APIs

**Solution:**
- Check browser console for errors
- Verify nginx gateway is running: `docker ps | grep nginx`
- Check nginx logs: `docker logs nginx-gateway-dev`
- Ensure client is using relative paths (/api/*)

## Getting Help

If you encounter issues during migration:

1. Check the logs: `docker compose -f docker-compose.dev.yml logs`
2. Verify network: `docker network ls`
3. Review documentation:
   - [README.md](README.md)
   - [ENVIRONMENTS.md](ENVIRONMENTS.md)
   - [nginx/README.md](nginx/README.md)
4. Open an issue on GitHub
5. Contact: mhm23811@gmail.com

## Next Steps After Migration

1. **Test thoroughly** - Ensure all features work as expected
2. **Update CI/CD** - Update deployment scripts to use new compose files
3. **Configure SSL/TLS** - Add SSL certificates for production (see nginx/README.md)
4. **Add monitoring** - Set up health check monitoring
5. **Review security** - Update CORS, add authentication if needed
6. **Documentation** - Update any custom documentation you have

## Benefits You'll Get

After migration, you'll have:

- ✅ **Better Development Experience**: Hot reload and easy debugging
- ✅ **Production-Ready Deployment**: Resource limits and optimizations
- ✅ **Improved Security**: Single entry point, security headers, SSL ready
- ✅ **Simplified Operations**: Helper scripts, clear separation
- ✅ **Scalability**: Easy to add load balancing and multiple instances
- ✅ **Modern Architecture**: Industry-standard nginx gateway pattern

## Summary

| Action | Legacy | New (Dev) | New (Prod) |
|--------|--------|-----------|------------|
| **Start** | `docker-compose up` | `docker compose -f docker-compose.dev.yml up` | `docker compose -f docker-compose.prod.yml up -d` |
| **Stop** | `docker-compose down` | `docker compose -f docker-compose.dev.yml down` | `docker compose -f docker-compose.prod.yml down` |
| **Logs** | `docker-compose logs -f` | `docker compose -f docker-compose.dev.yml logs -f` | `docker compose -f docker-compose.prod.yml logs -f` |
| **Access** | http://localhost + :8000/:8001 | http://localhost | http://localhost |

Welcome to the new architecture! 🎉
