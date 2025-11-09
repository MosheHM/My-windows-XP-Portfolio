# Kubernetes Deployment for Windows XP Portfolio

This directory contains Kubernetes manifests for deploying the Windows XP Portfolio application to a Kubernetes cluster.

## Architecture

The Kubernetes deployment includes the following components:

```
┌─────────────────────────────────────────────┐
│          Nginx Gateway (NodePort)           │
│              Port: 30080                     │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────┬──────────────────┐
    │                 │                  │
┌───▼────┐     ┌─────▼──────┐    ┌─────▼─────┐
│ Client │     │ LLM Service│    │File Service│
│  :80   │     │   :8000    │    │   :8001    │
└────────┘     └────────────┘    └────────────┘
                      │                 │
              ┌───────▼────┐    ┌──────▼──────┐
              │ Model Cache│    │File Storage │
              │  PVC 10Gi  │    │ PVC 20Gi    │
              └────────────┘    └─────────────┘
```

## Components

### Services

1. **Nginx Gateway** (`nginx-gateway-deployment.yaml`)
   - Acts as an API gateway and reverse proxy
   - Routes requests to appropriate backend services
   - Exposes the application via NodePort (30080)
   - 2 replicas for high availability
   - Resources: 128Mi-256Mi RAM, 100m-250m CPU

2. **Client** (`client-deployment.yaml`)
   - React frontend with Windows XP UI
   - Served through nginx gateway
   - 2 replicas for high availability
   - Resources: 128Mi-256Mi RAM, 100m-200m CPU

3. **LLM Service** (`llm-service-deployment.yaml`)
   - Python FastAPI service with TinyLlama model
   - RAG capabilities with FAISS
   - Single replica (model memory requirements)
   - Resources: 4Gi-8Gi RAM, 2-4 CPU cores
   - Uses persistent volume for model cache

4. **File Service** (`file-service-deployment.yaml`)
   - Python FastAPI file storage service
   - 2 replicas for high availability
   - Resources: 256Mi-512Mi RAM, 200m-500m CPU
   - Uses persistent volume for file storage

### Storage

- **LLM Model Cache PVC**: 10Gi, ReadWriteOnce - Stores downloaded model files
- **File Storage PVC**: 20Gi, ReadWriteMany - Stores uploaded files

### Configuration

- **ConfigMap** (`configmap.yaml`): Application configuration
- **Nginx Config**: Embedded in nginx-gateway-deployment.yaml as ConfigMap

## Quick Start

### Prerequisites

- Kubernetes cluster (minikube, kind, GKE, EKS, AKS, etc.)
- kubectl configured to access your cluster
- At least 8GB RAM available for the LLM service
- StorageClass configured (default: `standard`)

**For Google Cloud (GKE):**
- See [GCP_QUICKSTART.md](../GCP_QUICKSTART.md) for GCP-specific setup
- Images should be pushed to Google Artifact Registry
- Modify deployment manifests to use Artifact Registry image paths

### Deployment Options

#### Option 1: Using the Deploy Script (Recommended)

```bash
# From the repository root
./scripts/deploy-k8s.sh
```

This script will:
- Check prerequisites
- Optionally build Docker images
- Create namespace
- Apply all manifests
- Wait for deployments to be ready
- Display access information

#### Option 2: Using Kustomize

```bash
# Deploy all resources
kubectl apply -k k8s/

# Check status
kubectl get all -n portfolio

# Get the access URL
kubectl get svc nginx-gateway -n portfolio
```

#### Option 3: Manual Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMaps
kubectl apply -f k8s/configmap.yaml -n portfolio

# Deploy services
kubectl apply -f k8s/llm-service-deployment.yaml -n portfolio
kubectl apply -f k8s/file-service-deployment.yaml -n portfolio
kubectl apply -f k8s/client-deployment.yaml -n portfolio
kubectl apply -f k8s/nginx-gateway-deployment.yaml -n portfolio

# Check status
kubectl get pods -n portfolio
```

## Building Docker Images

Before deploying, you need to build and make Docker images available to your cluster:

### For Local Development (minikube/kind)

```bash
# Set Docker environment (minikube)
eval $(minikube docker-env)

# Or load images (kind)
# kind load docker-image <image-name>:latest

# Build images
docker build -t nginx-gateway:latest ./nginx
docker build -t portfolio-client:latest ./client
docker build -t llm-service:latest ./services/llm-service
docker build -t file-service:latest ./services/file-service
```

### For Cloud Deployments

#### Google Cloud (GKE) with Artifact Registry

```bash
# Set your GCP project and region
export PROJECT_ID=my-portfolio-project
export REGION=us-central1

# Configure Docker for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push images
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/portfolio"

docker build -t $REGISTRY/nginx-gateway:latest ./nginx
docker push $REGISTRY/nginx-gateway:latest

docker build -t $REGISTRY/portfolio-client:latest ./client
docker push $REGISTRY/portfolio-client:latest

docker build -t $REGISTRY/llm-service:latest ./services/llm-service
docker push $REGISTRY/llm-service:latest

docker build -t $REGISTRY/file-service:latest ./services/file-service
docker push $REGISTRY/file-service:latest

# Update image references in deployment files
sed -i "s|image: portfolio-client:latest|image: $REGISTRY/portfolio-client:latest|g" k8s/client-deployment.yaml
sed -i "s|image: llm-service:latest|image: $REGISTRY/llm-service:latest|g" k8s/llm-service-deployment.yaml
sed -i "s|image: file-service:latest|image: $REGISTRY/file-service:latest|g" k8s/file-service-deployment.yaml
```

For automated GCP deployment, see [GCP_DEPLOYMENT.md](../GCP_DEPLOYMENT.md).

#### Other Cloud Registries

```bash
# Tag images with your registry
docker tag nginx-gateway:latest <registry>/nginx-gateway:latest
docker tag portfolio-client:latest <registry>/portfolio-client:latest
docker tag llm-service:latest <registry>/llm-service:latest
docker tag file-service:latest <registry>/file-service:latest

# Push to registry
docker push <registry>/nginx-gateway:latest
docker push <registry>/portfolio-client:latest
docker push <registry>/llm-service:latest
docker push <registry>/file-service:latest

# Update image references in deployment files
```

## Accessing the Application

### Via NodePort

```bash
# Get the node IP
kubectl get nodes -o wide

# Access at http://<node-ip>:30080
```

### Via Port Forward (Local Development)

```bash
kubectl port-forward service/nginx-gateway 8080:80 -n portfolio

# Access at http://localhost:8080
```

## Monitoring and Operations

### View Logs

```bash
# Nginx gateway logs
kubectl logs -f deployment/nginx-gateway -n portfolio

# LLM service logs
kubectl logs -f deployment/llm-service -n portfolio

# File service logs
kubectl logs -f deployment/file-service -n portfolio

# Client logs
kubectl logs -f deployment/portfolio-client -n portfolio
```

### Check Pod Status

```bash
# Watch all pods
kubectl get pods -n portfolio -w

# Describe a specific pod
kubectl describe pod <pod-name> -n portfolio
```

### Scale Services

```bash
# Scale client
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio

# Scale file service
kubectl scale deployment/file-service --replicas=3 -n portfolio

# Note: LLM service should remain at 1 replica due to model memory requirements
```

## Cleanup

```bash
# Delete the entire namespace (removes all resources)
kubectl delete namespace portfolio
```

## Key Features

The Kubernetes deployment provides production-grade capabilities:

1. **Scalability**: Easy horizontal scaling of services
2. **High Availability**: Multiple replicas with automatic failover
3. **Resource Management**: CPU and memory limits/requests
4. **Health Checks**: Liveness and readiness probes
5. **Rolling Updates**: Zero-downtime deployments
6. **Persistent Storage**: Managed by Kubernetes PVCs
7. **Service Discovery**: Built-in DNS for service communication
8. **Load Balancing**: Automatic load balancing across pods
9. **Production Ready**: Enterprise-grade deployment platform
