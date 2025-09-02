# Docker Desktop Deployment Guide

This guide explains how to run your Tindibandi application using Docker Desktop on Windows.

## 📋 Prerequisites

- Docker Desktop installed and running
- Windows 10/11 with WSL2 enabled (for Docker Desktop)

## 🚀 Quick Start

1. **Open terminal in your project directory:**
   ```powershell
   cd "C:\Users\sribayya\capsule project - updated"
   ```

2. **Build and start the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access your application:**
   - Open your browser and go to: http://localhost:3001
   - Admin panel: http://localhost:3001/admin

4. **To stop the application:**
   ```bash
   docker-compose down
   ```

## 📁 Simplified File Structure

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  mongo:
    image: mongo:6.0
    container_name: tindibandi-mongo
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: securepassword
      MONGO_INITDB_DATABASE: tindibandi
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
  
  app:
    build: .
    container_name: tindibandi-app
    depends_on:
      - mongo
    environment:
      NODE_ENV: development
      PORT: 3001
      MONGODB_URI: mongodb://admin:securepassword@mongo:27017/tindibandi?authSource=admin
      JWT_SECRET: your-jwt-secret-key
      ADMIN_PASSWORD: admin123
      SESSION_SECRET: your-session-secret
    ports:
      - "3001:3001"

volumes:
  mongo_data:
```

## 🛠️ Development Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs app
docker-compose logs mongo

# Rebuild and restart
docker-compose up --build

# Stop and remove containers
docker-compose down

# Remove volumes (clears database)
docker-compose down -v

# Execute commands inside running container
docker exec -it tindibandi-app sh
docker exec -it tindibandi-mongo mongosh
```

## 🔍 Troubleshooting

### Common Issues:

1. **Port already in use:**
   ```bash
   # Stop existing containers
   docker-compose down
   # Or change port in docker-compose.yml
   ```

2. **Build fails:**
   ```bash
   # Clean build without cache
   docker-compose build --no-cache
   ```

3. **Database connection issues:**
   ```bash
   # Check if MongoDB is running
   docker-compose logs mongo
   # Restart services
   docker-compose restart
   ```

4. **Application not loading:**
   ```bash
   # Check app logs
   docker-compose logs app
   # Verify port mapping
   docker-compose ps
   ```

## 🔧 Configuration

### Environment Variables (in docker-compose.yml):
- `NODE_ENV`: Set to 'development' for local testing
- `MONGODB_URI`: Connection string to MongoDB
- `JWT_SECRET`: Secret key for JWT tokens
- `ADMIN_PASSWORD`: Admin login password
- `SESSION_SECRET`: Session encryption key

### Default Credentials:
- **MongoDB**: admin / securepassword
- **Admin Panel**: admin / admin123

## 📊 Docker Desktop Features

1. **View containers**: Open Docker Desktop → Containers
2. **View logs**: Click on container name → Logs tab
3. **Monitor resources**: Check CPU/Memory usage
4. **Volume management**: Go to Volumes tab
5. **Port mapping**: Shows exposed ports

## 🎯 What Was Simplified

**Removed from Dockerfile:**
- Complex user management
- Health checks (Docker Desktop handles this)
- curl dependency
- Production optimizations

**Removed from docker-compose.yml:**
- Nginx reverse proxy (not needed for local development)
- Complex environment variable handling
- Health checks
- Custom networks (Docker Compose creates default network)
- Restart policies
- Volume mounting for logs

**Benefits:**
- Faster startup time
- Easier to understand and modify
- Less resource usage
- Perfect for local development and testing
- Works seamlessly with Docker Desktop

This simplified setup is ideal for development and testing on Docker Desktop while maintaining all core functionality of your application.
