import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    console.log("DEBUG: Initializing Prisma with URL:", process.env.DATABASE_URL);
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
