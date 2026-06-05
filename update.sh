#!/bin/bash
# Park4Mikines Updater

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Updating Park4Mikines...${NC}"

# 1. Pull latest code
git fetch origin
git reset --hard origin/main

# 2. Database Backup (Safety First)
if [ -f "prisma/app.db" ]; then
    echo -e "${BLUE}💾 Backing up database...${NC}"
    mkdir -p backups
    cp prisma/app.db "backups/app_$(date +%Y%m%d_%H%M%S).db"
fi

# 3. Pull new image and restart
echo -e "${BLUE}🏗️  Pulling new image and restarting...${NC}"
docker compose pull
docker compose up -d --remove-orphans

echo -e "${GREEN}✅ Update complete!${NC}"
