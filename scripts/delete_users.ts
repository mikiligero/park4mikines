import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Delete Spots first to satisfy foreign key constraints (Spot -> User)
        // Note: Deleting spots will cascade to SpotImages, SpotServices, and Favorites (linking to Spot)
        const deletedSpots = await prisma.spot.deleteMany({});
        console.log(`Deleted ${deletedSpots.count} spots.`);

        // Now delete Users
        // Note: Deleting users will cascade to Checklists and Favorites (linking to User)
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`Deleted ${deletedUsers.count} users.`);

    } catch (error) {
        console.error('Error deleting data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
