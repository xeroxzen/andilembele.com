#!/bin/bash

# Deployment script for Andile Mbele Portfolio - Server Direct Deployment
# Usage: ./deploy.sh [server_ip] [username]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-"139.84.233.151"}
USERNAME=${2:-"srvadmin"}
DOMAIN="andilembele.com"
DEPLOY_PATH="/var/www/andilembele.com"

echo -e "${GREEN}🚀 Starting server-side deployment for $DOMAIN...${NC}"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo -e "${YELLOW}⚠️  SSH key not found. Please ensure you have SSH access to the server.${NC}"
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}🔍 Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $USERNAME@$SERVER_IP exit 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to server. Please check your SSH configuration.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection successful${NC}"

# Deploy directly on server
echo -e "${YELLOW}📦 Deploying directly on server...${NC}"
ssh $USERNAME@$SERVER_IP << 'EOF'
    # Navigate to deployment directory
    cd /var/www/andilembele.com
    
    # Check if directory exists
    if [ ! -d "/var/www/andilembele.com" ]; then
        echo "❌ Deployment directory /var/www/andilembele.com does not exist"
        echo "Please ensure your website files are in the correct location"
        exit 1
    fi
    
    # Check if git repository exists
    if [ ! -d ".git" ]; then
        echo "🔧 Initializing git repository..."
        git init
        git remote add origin git@github.com:xeroxzen/Portfolio-Update.git
    fi
    
    # Pull latest changes from git
    echo "📥 Pulling latest changes from git..."
    if git remote get-url origin >/dev/null 2>&1; then
        # Stash any local changes to avoid conflicts
        git stash
        git pull origin main
        echo "✅ Git pull completed successfully"
    else
        echo "⚠️  Git remote not configured. Please set up the repository manually."
        exit 1
    fi
    
    # Set proper permissions for web server
    echo "🔐 Setting proper permissions..."
    sudo chown -R www-data:www-data /var/www/andilembele.com
    sudo chmod -R 755 /var/www/andilembele.com
    
    # Ensure specific files have correct permissions
    sudo chmod 644 /var/www/andilembele.com/*.html
    sudo chmod 644 /var/www/andilembele.com/*.css
    sudo chmod 644 /var/www/andilembele.com/*.js
    sudo chmod 644 /var/www/andilembele.com/*.xml
    sudo chmod 644 /var/www/andilembele.com/*.txt
    sudo chmod 644 /var/www/andilembele.com/*.ico
    sudo chmod 644 /var/www/andilembele.com/*.svg
    sudo chmod 644 /var/www/andilembele.com/*.webmanifest
    
    # Set permissions for images directory
    if [ -d "images" ]; then
        sudo chmod -R 644 /var/www/andilembele.com/images/*
    fi
    
    # Reload Nginx to serve updated content
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    
    # Log deployment
    echo "Server deployment completed at $(date)" | sudo tee -a /var/log/deploy.log
    
    echo "✅ Server deployment completed successfully"
EOF

# Test website accessibility
echo -e "${YELLOW}🔍 Testing website accessibility...${NC}"
if curl -f -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo -e "${GREEN}✅ Website is accessible at https://$DOMAIN${NC}"
else
    echo -e "${RED}❌ Website test failed - checking for common issues...${NC}"
    
    # Additional diagnostics
    echo -e "${YELLOW}🔍 Running diagnostics...${NC}"
    ssh $USERNAME@$SERVER_IP << 'EOF'
        echo "Checking Nginx status..."
        sudo systemctl status nginx --no-pager -l
        
        echo "Checking Nginx configuration..."
        sudo nginx -t
        
        echo "Checking deployment directory contents..."
        ls -la /var/www/andilembele.com/
        
        echo "Checking Nginx error logs..."
        sudo tail -10 /var/log/nginx/error.log
EOF
    exit 1
fi

# Check SSL certificate status
echo -e "${YELLOW}🔒 Checking SSL certificate...${NC}"
if ssh $USERNAME@$SERVER_IP "certbot certificates | grep -A 2 '$DOMAIN' | grep -q 'VALID'"; then
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
else
    echo -e "${YELLOW}⚠️  SSL certificate may need renewal${NC}"
    echo -e "${YELLOW}💡 Run: ssh $USERNAME@$SERVER_IP 'sudo certbot renew'${NC}"
fi

# Performance check
echo -e "${YELLOW}⚡ Checking performance...${NC}"
RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null https://$DOMAIN)
echo -e "${GREEN}✅ Response time: ${RESPONSE_TIME}s${NC}"

# Final status check
echo -e "${YELLOW}📊 Final status check...${NC}"
ssh $USERNAME@$SERVER_IP << 'EOF'
    echo "Nginx status:"
    sudo systemctl is-active nginx
    
    echo "Deployment directory size:"
    du -sh /var/www/andilembele.com/
    
    echo "Recent deployment logs:"
    tail -5 /var/log/deploy.log
EOF

echo -e "${GREEN}🎉 Server deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your portfolio is live at: https://$DOMAIN${NC}"
echo -e "${YELLOW}💡 To deploy future updates, simply run this script again${NC}" 