# Quick Start: Google Cloud Deployment

This guide provides a quick overview of deploying your Windows XP Portfolio to Google Cloud Platform (GCP).

## 🎯 What This Does

Automatically deploys your portfolio to Google Kubernetes Engine (GKE) using Google Artifact Registry for container images, triggered by pushes to the `main` branch.

## ⚡ Quick Setup (5 Steps)

### Step 1: Create GCP Project & Enable APIs

```bash
# Create project
gcloud projects create my-portfolio-project --name="My Portfolio"
gcloud config set project my-portfolio-project

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable compute.googleapis.com
```

### Step 2: Create Artifact Registry Repository

```bash
# Set your region (e.g., us-central1, europe-west1, asia-east1)
export REGION=us-central1

# Create Docker repository
gcloud artifacts repositories create portfolio \
  --repository-format=docker \
  --location=$REGION \
  --description="Portfolio container images"
```

### Step 3: Create GKE Cluster

```bash
# Create cluster
gcloud container clusters create portfolio-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-4 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5

# Get credentials
gcloud container clusters get-credentials portfolio-cluster --zone=us-central1-a
```

### Step 4: Create Service Account for GitHub

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment"

# Grant permissions
export PROJECT_ID=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Display key (copy this for GitHub)
cat key.json
```

### Step 5: Configure GitHub Secrets

Add these secrets to your GitHub repository (**Settings** → **Secrets and variables** → **Actions**):

| Secret Name | Value | Example |
|-------------|-------|---------|
| `GCP_SA_KEY` | Contents of `key.json` | `{"type": "service_account"...}` |
| `GCP_PROJECT_ID` | Your project ID | `my-portfolio-project` |
| `GKE_CLUSTER_NAME` | Cluster name | `portfolio-cluster` |
| `GKE_ZONE` | Cluster zone | `us-central1-a` |
| `GCP_REGION` | Region | `us-central1` |
| `GAR_LOCATION` | Artifact Registry location | `us-central1` |

**Don't forget to delete the key file after adding to GitHub:**
```bash
rm key.json
```

## 🚀 Deploy

Push to the main branch:

```bash
git checkout main
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build Docker images
2. Push to Artifact Registry
3. Deploy to GKE
4. Expose via LoadBalancer

## 🌐 Access Your Application

Get the external IP:

```bash
kubectl get svc nginx-gateway -n portfolio
```

Wait for `EXTERNAL-IP` to appear (may take a few minutes), then visit:
```
http://<EXTERNAL-IP>
```

## 📊 Monitor Deployment

### View Logs
```bash
kubectl logs -f deployment/portfolio-client -n portfolio
```

### Check Status
```bash
kubectl get pods -n portfolio
kubectl get svc -n portfolio
```

### Scale Services
```bash
kubectl scale deployment/portfolio-client --replicas=3 -n portfolio
```

## 💰 Cost Estimate

**Typical monthly costs** (us-central1 region):
- **GKE Cluster**: ~$150/month (3 x e2-standard-4 nodes)
- **Load Balancer**: ~$20/month
- **Artifact Registry**: ~$0.10/GB/month (storage)
- **Total**: ~$170-200/month

**To reduce costs:**
- Use smaller machine types (`e2-standard-2`)
- Reduce number of nodes
- Use preemptible nodes (non-production)
- Delete cluster when not in use

## 🧹 Cleanup

To delete all resources:

```bash
# Delete cluster
gcloud container clusters delete portfolio-cluster --zone=us-central1-a

# Delete repository
gcloud artifacts repositories delete portfolio --location=us-central1

# Delete service account
gcloud iam service-accounts delete github-actions@$PROJECT_ID.iam.gserviceaccount.com
```

## ⚠️ Troubleshooting

### Deployment Failed?

1. Check GitHub Actions logs in the **Actions** tab
2. Verify service account has correct permissions:
   ```bash
   gcloud projects get-iam-policy $PROJECT_ID
   ```

### Pods Not Starting?

```bash
# Check pod details
kubectl describe pod <pod-name> -n portfolio

# Check logs
kubectl logs <pod-name> -n portfolio
```

### External IP Pending?

Wait a few minutes. If still pending:
```bash
kubectl describe svc nginx-gateway -n portfolio
```

## 📚 Full Documentation

For detailed information, see [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)

## 🆘 Need Help?

- Check [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md) for detailed documentation
- Open an issue on GitHub
- Email: mhm23811@gmail.com

## 🎊 Success!

Once set up, every push to `main` automatically deploys to GKE!

```
┌─────────────────────────────────────────┐
│  git push origin main                   │
│                                         │
│  ↓                                      │
│                                         │
│  GitHub Actions                         │
│                                         │
│  ↓                                      │
│                                         │
│  Build & Push to Artifact Registry     │
│                                         │
│  ↓                                      │
│                                         │
│  Deploy to GKE                          │
│                                         │
│  ↓                                      │
│                                         │
│  http://<EXTERNAL-IP> ✨               │
└─────────────────────────────────────────┘
```
