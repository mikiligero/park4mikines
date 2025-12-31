import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
    const username = "admin";
    const password = await hashPassword("admin123");

    const user = await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
            username,
            password,
            name: "Admin Mikines",
            role: "ADMIN",
        },
    });

    console.log({ user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
