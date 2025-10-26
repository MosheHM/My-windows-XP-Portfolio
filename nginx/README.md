# Nginx API Gateway

This directory contains the Nginx configuration for the API gateway that routes requests to the appropriate backend services.

## Architecture

The nginx gateway acts as a reverse proxy and routes requests as follows:

```
Client Request
    ↓
Nginx Gateway (:80)
    ↓
    ├── /api/llm/*     → llm-service:8000
    ├── /api/files/*   → file-service:8001
    └── /*             → client:80
```

## Features

- **Reverse Proxy**: Routes API requests to appropriate backend services
- **SSL/TLS Ready**: Can be configured with SSL certificates for HTTPS
- **Load Balancing**: Upstream configuration supports multiple backend instances
- **Compression**: Gzip compression enabled for text-based content
- **Caching**: Cache headers for static assets
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Health Checks**: Health endpoint at `/health`
- **SSE Support**: Optimized for Server-Sent Events (LLM streaming)
- **File Upload**: Configured for large file uploads (100MB max)

## Configuration

### nginx.conf

The main configuration file that defines:
- Upstream servers for each backend service
- Proxy settings for SSE support
- Timeout configurations for LLM operations
- Security headers
- Compression settings

### Key Settings

- **proxy_read_timeout**: 300s (for long LLM responses)
- **client_max_body_size**: 100M (for file uploads)
- **proxy_buffering**: off (for SSE streaming)
- **gzip**: on (for compression)

## Usage

### With Kubernetes

The nginx gateway is deployed as part of the Kubernetes cluster:

```bash
# Automated deployment
./scripts/deploy-k8s.sh

# Or using Kustomize
kubectl apply -k k8s/

# Access via port-forward
kubectl port-forward service/nginx-gateway 8080:80 -n portfolio
```

### Standalone (Development/Testing)

Build and run the nginx container for testing:

```bash
cd nginx
docker build -t nginx-gateway .
docker run -p 80:80 --name nginx-gateway nginx-gateway
```

## Endpoints

All requests go through the nginx gateway:

- **Frontend**: http://localhost/
- **LLM API**: http://localhost/api/llm/*
- **File API**: http://localhost/api/files/*
- **Health Check**: http://localhost/health

## Customization

### Adding SSL/TLS

To enable HTTPS, update `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of configuration
}

server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### Adding Rate Limiting

To add rate limiting, update `nginx.conf`:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            # ... rest of configuration
        }
    }
}
```

### Adding Authentication

For basic authentication, update `nginx.conf`:

```nginx
server {
    location /api/ {
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
        # ... rest of configuration
    }
}
```

## Troubleshooting

### Check nginx configuration syntax

```bash
docker exec nginx-gateway nginx -t
```

### Reload nginx without downtime

```bash
docker exec nginx-gateway nginx -s reload
```

### View logs

```bash
docker logs nginx-gateway -f
```

### Test health endpoint

```bash
curl http://localhost/health
```

## Production Considerations

1. **SSL/TLS**: Always use HTTPS in production
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Authentication**: Add authentication layer for API endpoints
4. **Monitoring**: Set up monitoring and alerting
5. **Logging**: Configure centralized logging
6. **DDoS Protection**: Consider using Cloudflare or similar service
7. **Firewall**: Restrict access to backend services
8. **Updates**: Keep nginx updated with security patches
