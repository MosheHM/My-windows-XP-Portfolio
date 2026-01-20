# Systemd Service Management

This directory contains systemd service files for managing the portfolio application services.

## Overview

The portfolio application is containerized using Docker with Alpine Linux as the base OS. Systemd is used to manage and orchestrate the containers.

## Services

- **portfolio-client.service** - Frontend React application (port 3000)
- **portfolio-file-service.service** - File upload/download service (port 8001)
- **portfolio-llm-service.service** - LLM/AI chat service (port 8000)
- **portfolio-nginx.service** - Nginx API gateway (port 80)

## Installation

### 1. Build Docker Images

First, ensure all Docker images are built with Alpine Linux:

```bash
# From the repository root
cd client
docker build -t portfolio-client:latest .

cd ../services/file-service
docker build -t portfolio-file-service:latest .

cd ../llm-service
docker build -t portfolio-llm-service:latest .

cd ../../nginx
docker build -t portfolio-nginx:latest .
```

### 2. Create Docker Network

```bash
docker network create portfolio-network
```

### 3. Install Systemd Services

```bash
# Copy service files to systemd directory
sudo cp systemd/*.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable portfolio-client.service
sudo systemctl enable portfolio-file-service.service
sudo systemctl enable portfolio-llm-service.service
sudo systemctl enable portfolio-nginx.service
```

## Usage

### Start All Services

```bash
sudo systemctl start portfolio-client
sudo systemctl start portfolio-file-service
sudo systemctl start portfolio-llm-service
sudo systemctl start portfolio-nginx
```

### Check Service Status

```bash
sudo systemctl status portfolio-client
sudo systemctl status portfolio-file-service
sudo systemctl status portfolio-llm-service
sudo systemctl status portfolio-nginx
```

### View Service Logs

```bash
sudo journalctl -u portfolio-client -f
sudo journalctl -u portfolio-file-service -f
sudo journalctl -u portfolio-llm-service -f
sudo journalctl -u portfolio-nginx -f
```

### Stop Services

```bash
sudo systemctl stop portfolio-client
sudo systemctl stop portfolio-file-service
sudo systemctl stop portfolio-llm-service
sudo systemctl stop portfolio-nginx
```

### Restart Services

```bash
sudo systemctl restart portfolio-client
sudo systemctl restart portfolio-file-service
sudo systemctl restart portfolio-llm-service
sudo systemctl restart portfolio-nginx
```

## Docker Volume Management

The services use Docker volumes for persistent data:

- `portfolio-files` - File storage
- `portfolio-metadata` - File metadata
- `portfolio-llm-data` - LLM/RAG data

To view volumes:
```bash
docker volume ls | grep portfolio
```

## Alpine Linux Benefits

All services now run on Alpine Linux, providing:

- **Small footprint**: Alpine images are typically 5-10x smaller than Debian-based images
- **Security**: Minimal attack surface with fewer packages
- **Performance**: Faster startup times and lower memory usage
- **Efficiency**: Better resource utilization in production

## Service Dependencies

The nginx gateway service depends on the other services:
- Starts after client and file services are running
- Automatically manages routing to backend services

## Troubleshooting

### Service won't start
```bash
# Check service logs
sudo journalctl -u portfolio-<service-name> -n 50

# Check Docker container logs
docker logs portfolio-<service-name>
```

### Port conflicts
Ensure ports 80, 3000, 8000, and 8001 are not in use by other services.

### Docker network issues
```bash
# Recreate the network
docker network rm portfolio-network
docker network create portfolio-network

# Restart all services
sudo systemctl restart portfolio-*
```

## Automatic Restart

All services are configured with `Restart=always` and `RestartSec=10s`, meaning they will automatically restart if they crash or the system reboots.
