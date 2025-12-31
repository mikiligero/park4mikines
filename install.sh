#!/bin/bash
# Park4Mikines Installer
# Usage: bash install.sh

set -e

REPO_URL="https://github.com/mikiligero/park4mikines.git"
TARGET_DIR="park4mikines"

# 0. Check context
if [ -f "docker-compose.yml" ]; then
    echo "📂 Running inside project directory."
else
    # We are likely running via curl
    if [ -d "$TARGET_DIR" ]; then
        echo "⚠️  Directory '$TARGET_DIR' already exists. Updating..."
        cd "$TARGET_DIR"
        git pull origin main
    else
        echo "⬇️  Cloning repository into './$TARGET_DIR'..."
        git clone "$REPO_URL" "$TARGET_DIR"
        cd "$TARGET_DIR"
    fi
fi

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
    echo "DATABASE_URL=file:/tmp/dev.db" > .env
    
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
echo -e "${BLUE}🚀 Ensuring database file exists...${NC}"
mkdir -p prisma

# If it exists as a directory, it must be removed to allow file creation
if [ -d prisma/dev.db ]; then
    echo "⚠️  Found directory at prisma/dev.db. Removing..."
    rm -rf prisma/dev.db
fi

if [ ! -f prisma/dev.db ]; then
    echo "Creating empty database file to prevent Docker directory issue..."
    touch prisma/dev.db
fi

echo -e "${BLUE}🚀 Pulling and starting containers...${NC}"
docker compose pull
docker compose up -d --remove-orphans

echo -e "${BLUE}📦 Applying database migrations...${NC}"
# Use npx prisma migrate deploy to apply existing migrations to the new DB
docker exec park4mikines npx prisma migrate deploy

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌍 App running at http://$(hostname -I | awk '{print $1}'):3000${NC}"
