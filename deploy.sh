#!/bin/bash

# Deployment script for Andile Mbele Portfolio
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

echo -e "${GREEN}🚀 Starting deployment to $DOMAIN...${NC}"

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

# Deploy to server
echo -e "${YELLOW}📦 Deploying to server...${NC}"
ssh $USERNAME@$SERVER_IP << 'EOF'
    # Create deployment directory if it doesn't exist
    if [ ! -d "/var/www/andilembele.com" ]; then
        echo "📁 Creating deployment directory..."
        sudo mkdir -p /var/www/andilembele.com
        sudo chown $USER:www-data /var/www/andilembele.com
        sudo chmod 775 /var/www/andilembele.com
    fi
    
    # Navigate to deployment directory
    cd /var/www/andilembele.com
    
    # Initialize git repository if it doesn't exist
    if [ ! -d ".git" ]; then
        echo "🔧 Initializing git repository..."
        git init
        git remote add origin git@github.com:xeroxzen/Portfolio-Update.git
    fi
    
    # Pull latest changes (or clone if first time)
    if git remote get-url origin >/dev/null 2>&1; then
        git pull origin main
    else
        echo "⚠️  Git remote not configured. Please set up the repository manually."
        exit 1
    fi
    
    # Set proper permissions
    sudo chown -R www-data:www-data /var/www/andilembele.com
    sudo chmod -R 755 /var/www/andilembele.com
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    # Log deployment
    echo "Manual deployment completed at $(date)" | sudo tee -a /var/log/deploy.log
    
    echo "✅ Deployment completed on server"
EOF

# Test website
echo -e "${YELLOW}🔍 Testing website...${NC}"
if curl -f -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo -e "${GREEN}✅ Website is accessible at https://$DOMAIN${NC}"
else
    echo -e "${RED}❌ Website test failed${NC}"
    exit 1
fi

# Check SSL certificate
echo -e "${YELLOW}🔒 Checking SSL certificate...${NC}"
if ssh $USERNAME@$SERVER_IP "certbot certificates | grep -A 2 '$DOMAIN' | grep -q 'VALID'"; then
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
else
    echo -e "${YELLOW}⚠️  SSL certificate may need renewal${NC}"
fi

# Performance check
echo -e "${YELLOW}⚡ Checking performance...${NC}"
RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null https://$DOMAIN)
echo -e "${GREEN}✅ Response time: ${RESPONSE_TIME}s${NC}"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your portfolio is live at: https://$DOMAIN${NC}" 