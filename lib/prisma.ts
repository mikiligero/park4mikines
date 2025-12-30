import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    let url = process.env.DATABASE_URL;

    if (url && !url.startsWith("file:")) {
        console.warn("WARNING: DATABASE_URL missing 'file:' prefix. Auto-fixing.");
        url = `file:${url}`;
    }

    console.error("DEBUG: Initializing Prisma with URL:", url);

    return new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
