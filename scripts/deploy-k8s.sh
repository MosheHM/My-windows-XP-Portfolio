#!/bin/bash

# Kubernetes Deployment Script for Windows XP Portfolio
# This script automates the deployment of all services to Kubernetes

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="portfolio"
K8S_DIR="k8s"

echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Windows XP Portfolio - K8s Deploy${NC}"
echo -e "${GREEN}===================================${NC}"
echo

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    echo "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check if Kubernetes cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    echo "Please configure kubectl to access your cluster"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is installed and configured${NC}"
echo

# Step 1: Build Docker images (optional)
read -p "Do you want to build Docker images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    echo "Building client image..."
    docker build -t portfolio-client:latest ./client
    
    echo "Building LLM service image..."
    docker build -t llm-service:latest ./services/llm-service
    
    echo "Building file service image..."
    docker build -t file-service:latest ./services/file-service
    
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
    echo
fi

# Step 2: Create namespace
echo -e "${YELLOW}Creating namespace '${NAMESPACE}'...${NC}"
kubectl apply -f ${K8S_DIR}/namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"
echo

# Step 3: Apply ConfigMap
echo -e "${YELLOW}Applying ConfigMap...${NC}"
kubectl apply -f ${K8S_DIR}/configmap.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ ConfigMap applied${NC}"
echo

# Step 4: Deploy services
echo -e "${YELLOW}Deploying LLM service...${NC}"
kubectl apply -f ${K8S_DIR}/llm-service-deployment.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ LLM service deployed${NC}"
echo

echo -e "${YELLOW}Deploying file service...${NC}"
kubectl apply -f ${K8S_DIR}/file-service-deployment.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ File service deployed${NC}"
echo

echo -e "${YELLOW}Deploying client...${NC}"
kubectl apply -f ${K8S_DIR}/client-deployment.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ Client deployed${NC}"
echo

# Step 5: Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
echo "This may take a few minutes, especially for the LLM service..."
echo

kubectl wait --for=condition=available --timeout=600s \
    deployment/portfolio-client -n ${NAMESPACE}
echo -e "${GREEN}✓ Client is ready${NC}"

kubectl wait --for=condition=available --timeout=600s \
    deployment/file-service -n ${NAMESPACE}
echo -e "${GREEN}✓ File service is ready${NC}"

# LLM service may take longer
echo -e "${YELLOW}Waiting for LLM service (may take up to 5 minutes)...${NC}"
kubectl wait --for=condition=available --timeout=600s \
    deployment/llm-service -n ${NAMESPACE} || \
    echo -e "${YELLOW}⚠ LLM service is still starting. Check status with: kubectl get pods -n ${NAMESPACE}${NC}"

echo

# Step 6: Display status
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}===================================${NC}"
echo

echo "Pods:"
kubectl get pods -n ${NAMESPACE}
echo

echo "Services:"
kubectl get svc -n ${NAMESPACE}
echo

echo "PVCs:"
kubectl get pvc -n ${NAMESPACE}
echo

# Step 7: Get access information
NODE_PORT=$(kubectl get svc client-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].nodePort}')
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Access Information${NC}"
echo -e "${GREEN}===================================${NC}"
echo
echo "The application is exposed via NodePort on port: ${NODE_PORT}"
echo
echo "To access the application:"
echo "1. Get your node IP:"
echo -e "   ${YELLOW}kubectl get nodes -o wide${NC}"
echo "2. Access the application at:"
echo -e "   ${YELLOW}http://<node-ip>:${NODE_PORT}${NC}"
echo
echo "For local access with port-forward:"
echo -e "   ${YELLOW}kubectl port-forward service/client-service 8080:80 -n ${NAMESPACE}${NC}"
echo -e "   Then access at: ${YELLOW}http://localhost:8080${NC}"
echo

# Step 8: Helpful commands
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}Useful Commands${NC}"
echo -e "${GREEN}===================================${NC}"
echo
echo "View logs:"
echo -e "  ${YELLOW}kubectl logs -f deployment/llm-service -n ${NAMESPACE}${NC}"
echo -e "  ${YELLOW}kubectl logs -f deployment/file-service -n ${NAMESPACE}${NC}"
echo -e "  ${YELLOW}kubectl logs -f deployment/portfolio-client -n ${NAMESPACE}${NC}"
echo
echo "Check pod status:"
echo -e "  ${YELLOW}kubectl get pods -n ${NAMESPACE} -w${NC}"
echo
echo "Describe resources:"
echo -e "  ${YELLOW}kubectl describe pod <pod-name> -n ${NAMESPACE}${NC}"
echo
echo "Delete all resources:"
echo -e "  ${YELLOW}kubectl delete namespace ${NAMESPACE}${NC}"
echo

echo -e "${GREEN}✓ Deployment complete!${NC}"
