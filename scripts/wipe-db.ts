import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Wiping database...');

    // Delete in order of dependencies
    await prisma.checklistItem.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.spotService.deleteMany();
    await prisma.spotImage.deleteMany();
    await prisma.spot.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database wiped successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
