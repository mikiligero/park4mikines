#!/bin/bash
# Park4Mikines Installer
# Usage: bash install.sh

set -e

REPO_URL="https://github.com/mikiligero/park4mikines.git"
INSTALL_DIR="$(pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   🅿️  Park4Mikines Installer          ${NC}"
echo -e "${BLUE}=======================================${NC}"

# 1. Environment Check
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}❌ Docker not found.${NC}"
    echo "Please install Docker on your LXC container first."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    apt-get update && apt-get install -y git || apk add git
fi

# 2. Setup .env
if [ ! -f .env ]; then
    echo -e "${BLUE}⚙️  Generating .env...${NC}"
    echo "DATABASE_URL=file:/app/prisma/dev.db" > .env
    
    # Generate JWT Secret
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -hex 32)
    else
        SECRET="secret_$(date +%s)"
    fi
    echo "JWT_SECRET=$SECRET" >> .env
fi

# 3. Permissions
echo -e "${BLUE}🔧 Setting permissions...${NC}"
chmod +x update.sh

# 4. Build & Launch
echo -e "${BLUE}🚀 Building and starting containers...${NC}"
docker compose up -d --build --remove-orphans

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌍 App running at http://$(hostname -I | awk '{print $1}'):3000${NC}"
