# Linux Server Deployment Guide - Tindi Bandi Project

This guide covers deploying the Tindi Bandi food delivery application on a Linux server.

## Prerequisites

- Linux server (Ubuntu 18.04+ recommended)
- Node.js 16.x or higher
- MongoDB (local installation or MongoDB Atlas)
- Domain name (optional but recommended for production)
- SSL certificate (for HTTPS in production)

## Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js
```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.3 Install MongoDB (Option A: Local Installation)
```bash
# Import MongoDB public GPG Key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Reload local package database
sudo apt-get update

# Install MongoDB packages
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### 1.4 Install Process Manager (PM2)
```bash
sudo npm install -g pm2
```

### 1.5 Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 2: Application Deployment

### 2.1 Clone/Upload Project
```bash
# Create application directory
sudo mkdir -p /var/www/tindibandi
sudo chown $USER:$USER /var/www/tindibandi

# Navigate to directory
cd /var/www/tindibandi

# Upload your project files or clone from git
# git clone <your-repository-url> .
```

### 2.2 Install Dependencies
```bash
npm install --production
```

### 2.3 Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

#### Production Environment Variables:
```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tindibandi
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tindibandi

# Security Configuration - CHANGE THESE!
JWT_SECRET=your-very-secure-random-string-here
ADMIN_PASSWORD=your-secure-admin-password

# API Configuration
API_BASE_URL=https://yourdomain.com
# OR for IP-based access:
# API_BASE_URL=http://your-server-ip:3001

# Session Configuration - CHANGE THIS!
SESSION_SECRET=another-secure-random-string
```

### 2.4 Test Application
```bash
# Test the application
node server.js

# Application should start and show:
# Server running on 0.0.0.0:3001
# Environment: production
# MongoDB connected successfully
```

## Step 3: Process Management with PM2

### 3.1 Create PM2 Configuration
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'tindibandi',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### 3.2 Start Application with PM2
```bash
# Create logs directory
mkdir logs

# Start application in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Monitor application
pm2 status
pm2 logs tindibandi
```

## Step 4: Nginx Configuration

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/tindibandi
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain

    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For HTTP only setup (development/testing):
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Handle static files
    location /assets/ {
        proxy_pass http://localhost:3001/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### 4.2 Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tindibandi /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 5: SSL Certificate (Production)

### 5.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obtain SSL Certificate
```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5.3 Update Nginx for HTTPS
After SSL installation, update your Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /assets/ {
        proxy_pass http://localhost:3001/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Step 6: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Check firewall status
sudo ufw status
```

## Step 7: Database Backup (Optional)

### 7.1 Create Backup Script
```bash
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --db tindibandi --out $BACKUP_DIR/backup_$DATE

# Keep only last 7 backups
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} \;
```

### 7.2 Setup Cron Job
```bash
# Make script executable
chmod +x backup-db.sh

# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /var/www/tindibandi/backup-db.sh
```

## Step 8: Monitoring and Logs

### 8.1 View Application Logs
```bash
# PM2 logs
pm2 logs tindibandi

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u mongod -f
```

### 8.2 Monitoring Commands
```bash
# Check application status
pm2 status

# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check active connections
ss -tulnp | grep :3001
```

## Troubleshooting

### Common Issues:

1. **Port 3001 not accessible**: Check firewall and Nginx configuration
2. **MongoDB connection issues**: Verify MongoDB service and connection string
3. **Permission errors**: Check file ownership and permissions
4. **SSL certificate issues**: Verify domain DNS and certificate paths

### Useful Commands:
```bash
# Restart all services
sudo systemctl restart nginx
pm2 restart tindibandi
sudo systemctl restart mongod

# Check service status
sudo systemctl status nginx
sudo systemctl status mongod
pm2 status

# View real-time logs
pm2 logs tindibandi --lines 100
```

## Update Deployment

```bash
# Stop application
pm2 stop tindibandi

# Update code (git pull or upload new files)
git pull origin main  # or your deployment method

# Install new dependencies (if any)
npm install --production

# Start application
pm2 start tindibandi

# Verify deployment
curl -I http://localhost:3001
```

## Security Recommendations

1. Change default passwords in `.env`
2. Use strong, random JWT secrets
3. Enable firewall with minimal required ports
4. Use HTTPS in production
5. Regularly update system packages
6. Monitor logs for suspicious activity
7. Consider using fail2ban for additional security
8. Regular database backups

## Support

For issues with deployment, check:
1. Application logs: `pm2 logs tindibandi`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. MongoDB logs: `sudo journalctl -u mongod -f`
4. System resources: `htop` and `df -h`

Your Tindi Bandi application should now be accessible at your domain name or server IP address!
