# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the portfolio application.

## Files

- `namespace.yaml` - Creates the `portfolio` namespace
- `configmap.yaml` - Configuration for all services
- `client-deployment.yaml` - Client deployment and NodePort service
- `llm-service-deployment.yaml` - LLM service deployment, ClusterIP service, and PVC
- `file-service-deployment.yaml` - File service deployment, ClusterIP service, and PVC

## Deployment Order

1. Create namespace
2. Apply ConfigMap
3. Deploy services (order doesn't matter due to ClusterIP)

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml -n portfolio
kubectl apply -f llm-service-deployment.yaml -n portfolio
kubectl apply -f file-service-deployment.yaml -n portfolio
kubectl apply -f client-deployment.yaml -n portfolio
```

## Access

The client is exposed via NodePort on port 30080:
```bash
# Get node IP
kubectl get nodes -o wide

# Access application
http://<node-ip>:30080
```

For local development with port-forward:
```bash
kubectl port-forward service/client-service 8080:80 -n portfolio
# Access at http://localhost:8080
```

## Resources

### LLM Service
- **Requests**: 4Gi memory, 2 CPU cores
- **Limits**: 8Gi memory, 4 CPU cores
- **Storage**: 10Gi PVC for model cache

### File Service
- **Requests**: 256Mi memory, 200m CPU
- **Limits**: 512Mi memory, 500m CPU
- **Storage**: 20Gi PVC (ReadWriteMany)

### Client
- **Requests**: 128Mi memory, 100m CPU
- **Limits**: 256Mi memory, 200m CPU

## Scaling

```bash
# Scale client
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio

# Scale file service
kubectl scale deployment/file-service --replicas=3 -n portfolio

# Note: LLM service should remain at 1 replica due to model memory
```

## Monitoring

```bash
# Check pod status
kubectl get pods -n portfolio

# View logs
kubectl logs -f deployment/llm-service -n portfolio
kubectl logs -f deployment/file-service -n portfolio
kubectl logs -f deployment/portfolio-client -n portfolio

# Check resource usage
kubectl top pods -n portfolio
```

## Troubleshooting

### LLM Service not starting
- Check if sufficient memory is available (needs 4-8GB)
- View logs: `kubectl logs -f deployment/llm-service -n portfolio`
- Check PVC is bound: `kubectl get pvc -n portfolio`

### Client can't connect to services
- Verify services are running: `kubectl get svc -n portfolio`
- Check environment variables in client deployment
- Ensure backend services are healthy: `kubectl get pods -n portfolio`

### PVC issues
- Check storage class exists: `kubectl get storageclass`
- View PVC status: `kubectl get pvc -n portfolio`
- Describe PVC for events: `kubectl describe pvc <pvc-name> -n portfolio`
