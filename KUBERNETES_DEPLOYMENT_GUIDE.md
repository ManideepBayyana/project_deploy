# Kubernetes Deployment Guide for Ubuntu Server

This guide provides step-by-step instructions to deploy your Tindibandi application on Kubernetes with load balancing on Ubuntu Server.

## 📋 Prerequisites

- Ubuntu Server 20.04+ 
- Minimum 4GB RAM, 2 CPU cores
- Root or sudo access
- Internet connection

## 🔧 Step 1: Install Docker

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group (logout and login after this)
sudo usermod -aG docker $USER
```

## ⚡ Step 2: Install Kubernetes (using Minikube for single-node setup)

### Option A: Minikube (Recommended for testing/development)

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x minikube
sudo mv minikube /usr/local/bin/

# Start Minikube with sufficient resources
minikube start --driver=docker --memory=4096 --cpus=2

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```

### Option B: Production Kubernetes Cluster (kubeadm)

```bash
# Install kubeadm, kubelet, kubectl
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl

curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Initialize the cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Setup kubectl for regular user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install network plugin (Flannel)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# Allow scheduling pods on control-plane (for single-node setup)
kubectl taint nodes --all node-role.kubernetes.io/control-plane-

# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/baremetal/deploy.yaml
```

## 🏗️ Step 3: Prepare Your Application

```bash
# Navigate to your project directory
cd /path/to/your/capsule-project

# Build the Docker image
docker build -t tindibandi-app:latest .

# If using Minikube, load the image into Minikube
minikube image load tindibandi-app:latest
```

## 🚀 Step 4: Deploy to Kubernetes

### Quick Deployment (using the provided script)

```bash
# Make the deployment script executable
chmod +x k8s/deploy.sh

# Run the deployment
./k8s/deploy.sh
```

### Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yml

# 2. Apply secrets and config
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/configmap.yml

# 3. Set up storage
kubectl apply -f k8s/storage.yml

# 4. Deploy MongoDB
kubectl apply -f k8s/mongodb.yml

# 5. Wait for MongoDB to be ready
kubectl wait --for=condition=Available --timeout=300s deployment/mongo-deployment -n tindibandi

# 6. Deploy the application
kubectl apply -f k8s/app-deployment.yml

# 7. Wait for app to be ready
kubectl wait --for=condition=Available --timeout=300s deployment/tindibandi-app -n tindibandi

# 8. Create services
kubectl apply -f k8s/app-services.yml

# 9. (Optional) Set up Ingress
kubectl apply -f k8s/ingress.yml
```

## 🔍 Step 5: Verify Deployment

```bash
# Check all resources in the namespace
kubectl get all -n tindibandi

# Check service status
kubectl get svc -n tindibandi

# Check pod logs
kubectl logs -f deployment/tindibandi-app -n tindibandi

# Check MongoDB status
kubectl logs -f deployment/mongo-deployment -n tindibandi
```

## 🌐 Step 6: Access Your Application

### Using LoadBalancer Service

```bash
# Get the external IP (may take a few minutes)
kubectl get svc tindibandi-loadbalancer -n tindibandi

# For Minikube, get the service URL
minikube service tindibandi-loadbalancer -n tindibandi --url
```

### Using Ingress (Alternative)

```bash
# For Minikube
minikube ip
# Add to /etc/hosts: <minikube-ip> tindibandi.local

# Access at: http://tindibandi.local
```

### Using NodePort (Alternative)

```bash
# Get NodePort
kubectl get svc tindibandi-loadbalancer -n tindibandi

# Access at: http://<server-ip>:<nodeport>
```

## 📊 Step 7: Monitoring and Scaling

```bash
# View resource usage
kubectl top pods -n tindibandi
kubectl top nodes

# Scale the application
kubectl scale deployment tindibandi-app --replicas=5 -n tindibandi

# View horizontal pod autoscaler (if applied)
kubectl get hpa -n tindibandi

# View ingress status
kubectl get ingress -n tindibandi
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

1. **Pods stuck in Pending state**
   ```bash
   kubectl describe pod <pod-name> -n tindibandi
   # Check for resource constraints or PVC issues
   ```

2. **Application can't connect to MongoDB**
   ```bash
   kubectl logs deployment/tindibandi-app -n tindibandi
   kubectl exec -it deployment/mongo-deployment -n tindibandi -- mongosh
   ```

3. **LoadBalancer stuck in Pending**
   ```bash
   # For Minikube, use NodePort or Ingress instead
   # For cloud providers, ensure LoadBalancer service is supported
   ```

4. **Image pull errors**
   ```bash
   # For Minikube, ensure image is loaded:
   minikube image load tindibandi-app:latest
   
   # Check if image exists:
   minikube image ls
   ```

### Useful Commands

```bash
# Port forward to access services locally
kubectl port-forward svc/tindibandi-app-service 3001:3001 -n tindibandi

# Execute commands in pods
kubectl exec -it deployment/tindibandi-app -n tindibandi -- /bin/sh

# View all events
kubectl get events -n tindibandi --sort-by='.lastTimestamp'

# Get detailed pod information
kubectl describe pod <pod-name> -n tindibandi
```

## 🔒 Security Considerations

1. **Update default passwords** in `k8s/secret.yml`
2. **Use TLS/SSL** for production deployments
3. **Network Policies** to restrict pod communication
4. **RBAC** for access control
5. **Resource Quotas** to prevent resource exhaustion

## 📈 Production Recommendations

1. **Use external MongoDB** service (MongoDB Atlas, etc.)
2. **Implement proper backup** strategies
3. **Set up monitoring** (Prometheus, Grafana)
4. **Configure log aggregation** (ELK stack, Fluentd)
5. **Use container registry** for images
6. **Implement CI/CD** pipelines
7. **Set up disaster recovery** procedures

## 🧹 Cleanup

```bash
# Remove the entire application
kubectl delete namespace tindibandi

# Stop Minikube (if using Minikube)
minikube stop

# Delete Minikube (if needed)
minikube delete
```

## 📝 File Structure

The Kubernetes configuration includes:

- `namespace.yml` - Isolated namespace for the application
- `secret.yml` - Sensitive data (passwords, tokens)
- `configmap.yml` - Application configuration
- `storage.yml` - Persistent volumes for MongoDB
- `mongodb.yml` - MongoDB deployment and service
- `app-deployment.yml` - Application deployment with scaling
- `app-services.yml` - ClusterIP and LoadBalancer services
- `ingress.yml` - Ingress controller and HPA configuration
- `deploy.sh` - Automated deployment script

## 🎯 Load Balancing Explained

Your setup includes multiple load balancing mechanisms:

1. **LoadBalancer Service**: Distributes traffic across app pods
2. **HorizontalPodAutoscaler**: Automatically scales pods based on CPU/memory
3. **Multiple Replicas**: Runs 3 app instances by default
4. **Ingress Controller**: Alternative load balancing with additional features

The LoadBalancer service automatically distributes incoming requests across all available application pods, providing high availability and improved performance.
