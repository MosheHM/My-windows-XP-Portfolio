# Google Cloud Deployment Guide

This guide explains how to deploy your Windows XP Portfolio to Google Cloud Platform (GCP) using Google Kubernetes Engine (GKE).

## Overview

The application is deployed to GKE (Google Kubernetes Engine) with the following architecture:
- Container images stored in Google Artifact Registry
- Kubernetes cluster running on GKE
- Automatic deployment via GitHub Actions
- Load balancer for external access

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Account**: Active GCP account with billing enabled
2. **Google Cloud Project**: A GCP project created for this application
3. **GitHub Repository**: Access to configure secrets
4. **gcloud CLI** (for local testing): [Install gcloud](https://cloud.google.com/sdk/docs/install)

## Initial Setup

### Step 1: Set Up Google Cloud Project

1. **Create a new project** (or use an existing one):
   ```bash
   gcloud projects create my-portfolio-project --name="My Portfolio"
   gcloud config set project my-portfolio-project
   ```

2. **Enable required APIs**:
   ```bash
   gcloud services enable container.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable compute.googleapis.com
   ```

3. **Set your project ID** (replace with your actual project ID):
   ```bash
   export PROJECT_ID=my-portfolio-project
   gcloud config set project $PROJECT_ID
   ```

### Step 2: Create Artifact Registry Repository

Create a Docker repository in Artifact Registry to store your container images:

```bash
# Set your preferred region (e.g., us-central1, europe-west1, asia-east1)
export REGION=us-central1

# Create the repository
gcloud artifacts repositories create portfolio \
  --repository-format=docker \
  --location=$REGION \
  --description="Portfolio application container images"

# Verify creation
gcloud artifacts repositories list
```

### Step 3: Create GKE Cluster

Create a Kubernetes cluster on GKE:

```bash
# Set cluster configuration
export CLUSTER_NAME=portfolio-cluster
export ZONE=us-central1-a

# Create cluster with recommended settings
gcloud container clusters create $CLUSTER_NAME \
  --zone=$ZONE \
  --num-nodes=3 \
  --machine-type=e2-standard-4 \
  --disk-size=50 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing

# Get credentials for kubectl
gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE
```

**Note**: The LLM service requires significant memory (4-8GB). The `e2-standard-4` machine type provides 4 vCPUs and 16GB RAM. Adjust based on your needs:
- **Smaller/Testing**: `e2-standard-2` (2 vCPUs, 8GB RAM)
- **Production**: `e2-standard-4` or `e2-standard-8` (8 vCPUs, 32GB RAM)

### Step 4: Create Service Account for GitHub Actions

Create a service account that GitHub Actions will use to deploy:

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Display the key (you'll need this for GitHub secrets)
cat key.json
```

**Important**: Keep this key file secure and delete it from your local machine after adding to GitHub secrets.

### Step 5: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GCP_SA_KEY` | Contents of `key.json` | Service account key for authentication |
| `GCP_PROJECT_ID` | Your project ID (e.g., `my-portfolio-project`) | Google Cloud project ID |
| `GKE_CLUSTER_NAME` | `portfolio-cluster` (or your cluster name) | GKE cluster name |
| `GKE_ZONE` | `us-central1-a` (or your zone) | GKE cluster zone |
| `GCP_REGION` | `us-central1` (or your region) | Google Cloud region |
| `GAR_LOCATION` | `us-central1` (or your registry location) | Artifact Registry location |

**To get the service account key content:**
```bash
cat key.json
# Copy the entire JSON output
```

After adding the key to GitHub, delete the local file:
```bash
rm key.json
```

## Deployment

### Automatic Deployment (via GitHub Actions)

Once configured, the application will automatically deploy when you push to the `main` branch:

```bash
git checkout main
git push origin main
```

The GitHub Actions workflow will:
1. Authenticate to Google Cloud
2. Build Docker images
3. Push images to Artifact Registry
4. Deploy to GKE cluster
5. Verify deployment

Monitor the deployment in the **Actions** tab of your GitHub repository.

### Manual Deployment (Local)

You can also deploy manually from your local machine:

```bash
# Authenticate to Google Cloud
gcloud auth login

# Set project
gcloud config set project $PROJECT_ID

# Get cluster credentials
gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE

# Configure Docker for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push images
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/portfolio"

docker build -t $REGISTRY/portfolio-client:latest ./client
docker push $REGISTRY/portfolio-client:latest

docker build -t $REGISTRY/llm-service:latest ./services/llm-service
docker push $REGISTRY/llm-service:latest

docker build -t $REGISTRY/file-service:latest ./services/file-service
docker push $REGISTRY/file-service:latest

# Update image references in Kubernetes manifests
sed -i "s|image: portfolio-client:latest|image: $REGISTRY/portfolio-client:latest|g" k8s/client-deployment.yaml
sed -i "s|image: llm-service:latest|image: $REGISTRY/llm-service:latest|g" k8s/llm-service-deployment.yaml
sed -i "s|image: file-service:latest|image: $REGISTRY/file-service:latest|g" k8s/file-service-deployment.yaml

# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml -n portfolio
kubectl apply -f k8s/llm-service-deployment.yaml -n portfolio
kubectl apply -f k8s/file-service-deployment.yaml -n portfolio
kubectl apply -f k8s/client-deployment.yaml -n portfolio
kubectl apply -f k8s/nginx-gateway-deployment.yaml -n portfolio

# Wait for deployments
kubectl wait --for=condition=available --timeout=600s deployment/portfolio-client -n portfolio
```

## Access Your Application

### Get External IP

After deployment, get the external IP address:

```bash
kubectl get svc nginx-gateway -n portfolio
```

Wait for the `EXTERNAL-IP` to change from `<pending>` to an actual IP address. This may take a few minutes.

Once you have the IP, access your application at:
```
http://<EXTERNAL-IP>
```

### Set Up Custom Domain (Optional)

To use a custom domain:

1. **Get the external IP**:
   ```bash
   kubectl get svc nginx-gateway -n portfolio -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
   ```

2. **Create DNS A record**: Point your domain to this IP address

3. **Configure SSL/TLS** (recommended):
   ```bash
   # Install cert-manager for automatic SSL certificates
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   
   # Configure Let's Encrypt issuer and update ingress
   # See k8s/ingress-example.yaml for reference
   ```

## Monitoring and Management

### View Logs

```bash
# View all pods
kubectl get pods -n portfolio

# View logs for specific service
kubectl logs -f deployment/portfolio-client -n portfolio
kubectl logs -f deployment/llm-service -n portfolio
kubectl logs -f deployment/file-service -n portfolio

# View logs for nginx gateway
kubectl logs -f deployment/nginx-gateway -n portfolio
```

### Check Deployment Status

```bash
# Check all resources
kubectl get all -n portfolio

# Check pod status
kubectl get pods -n portfolio

# Check service status
kubectl get svc -n portfolio

# Describe a pod for detailed information
kubectl describe pod <pod-name> -n portfolio
```

### Scale Services

```bash
# Scale client service
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio

# Scale file service
kubectl scale deployment/file-service --replicas=3 -n portfolio
```

### Restart Services

```bash
# Restart all deployments
kubectl rollout restart deployment/portfolio-client -n portfolio
kubectl rollout restart deployment/llm-service -n portfolio
kubectl rollout restart deployment/file-service -n portfolio
kubectl rollout restart deployment/nginx-gateway -n portfolio
```

### View Resource Usage

```bash
# Get cluster info
gcloud container clusters describe $CLUSTER_NAME --zone=$ZONE

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -n portfolio
```

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs**:
   - Go to the **Actions** tab in your repository
   - Click on the failed workflow run
   - Review the error messages

2. **Verify GCP authentication**:
   ```bash
   gcloud auth list
   gcloud config get-value project
   ```

3. **Check service account permissions**:
   ```bash
   gcloud projects get-iam-policy $PROJECT_ID \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com"
   ```

### Pods Not Starting

1. **Check pod status**:
   ```bash
   kubectl get pods -n portfolio
   kubectl describe pod <pod-name> -n portfolio
   ```

2. **Check pod logs**:
   ```bash
   kubectl logs <pod-name> -n portfolio
   ```

3. **Common issues**:
   - **ImagePullBackOff**: Image not found in Artifact Registry. Verify image was pushed correctly.
   - **CrashLoopBackOff**: Application error. Check logs for details.
   - **Pending**: Insufficient resources. Check node capacity and consider scaling the cluster.

### External IP Stays Pending

If the LoadBalancer external IP stays in `<pending>` state:

```bash
# Check service status
kubectl describe svc nginx-gateway -n portfolio

# Check for events
kubectl get events -n portfolio --sort-by='.lastTimestamp'

# Verify Load Balancer is being created
gcloud compute forwarding-rules list
```

### Image Pull Errors

```bash
# Verify Artifact Registry access
gcloud artifacts repositories list

# Verify images exist
gcloud artifacts docker images list $REGION-docker.pkg.dev/$PROJECT_ID/portfolio

# Test Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev
docker pull $REGION-docker.pkg.dev/$PROJECT_ID/portfolio/portfolio-client:latest
```

## Cost Optimization

### Monitor Costs

```bash
# View current month costs
gcloud billing accounts list
```

Check the [GCP Billing Console](https://console.cloud.google.com/billing) for detailed cost breakdown.

### Reduce Costs

1. **Use preemptible nodes** (for non-production):
   ```bash
   gcloud container clusters create $CLUSTER_NAME \
     --zone=$ZONE \
     --preemptible \
     --machine-type=e2-standard-2
   ```

2. **Auto-scale down during off-hours**:
   ```bash
   # Scale to minimum replicas
   kubectl scale deployment/portfolio-client --replicas=1 -n portfolio
   kubectl scale deployment/file-service --replicas=1 -n portfolio
   ```

3. **Use smaller machine types** for testing:
   ```bash
   # Resize cluster (requires recreation)
   gcloud container clusters resize $CLUSTER_NAME --num-nodes=2 --zone=$ZONE
   ```

4. **Delete cluster when not in use**:
   ```bash
   gcloud container clusters delete $CLUSTER_NAME --zone=$ZONE
   ```

## Cleanup

To delete all resources and stop incurring charges:

```bash
# Delete the GKE cluster
gcloud container clusters delete $CLUSTER_NAME --zone=$ZONE

# Delete Artifact Registry repository
gcloud artifacts repositories delete portfolio --location=$REGION

# Delete service account
gcloud iam service-accounts delete github-actions@$PROJECT_ID.iam.gserviceaccount.com

# (Optional) Delete the entire project
gcloud projects delete $PROJECT_ID
```

## Security Best Practices

1. **Use Workload Identity** (advanced):
   - More secure than service account keys
   - See: [Workload Identity documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)

2. **Enable Binary Authorization**:
   ```bash
   gcloud services enable binaryauthorization.googleapis.com
   ```

3. **Use Private GKE cluster** (for production):
   ```bash
   gcloud container clusters create $CLUSTER_NAME \
     --enable-private-nodes \
     --enable-ip-alias \
     --master-ipv4-cidr=172.16.0.0/28
   ```

4. **Enable network policies**:
   ```bash
   gcloud container clusters update $CLUSTER_NAME \
     --enable-network-policy \
     --zone=$ZONE
   ```

5. **Rotate service account keys regularly**:
   ```bash
   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
   
   # Create new key
   gcloud iam service-accounts keys create new-key.json \
     --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
   ```

## Additional Resources

- [Google Kubernetes Engine Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [GKE Best Practices](https://cloud.google.com/kubernetes-engine/docs/best-practices)
- [GitHub Actions for GCP](https://github.com/google-github-actions)

## Support

For issues or questions:
- Open an issue on GitHub
- Email: mhm23811@gmail.com
- LinkedIn: https://www.linkedin.com/in/moshe-haim-makias/
