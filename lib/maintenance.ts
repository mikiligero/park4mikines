"use server";

import prisma from "./prisma";
import fs from "fs/promises";
import path from "path";
import { getSession } from "./auth";

export async function cleanupImages() {
    const session = await getSession();
    if (!session || !session.userId) {
        if (!session?.userId) return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Get all image URLs from DB
        const spotImages = await prisma.spotImage.findMany({
            select: { url: true }
        });

        // 2. Normalize DB paths (remove leading slash if present, e.g. /uploads/...)
        const dbFiles = new Set(
            spotImages.map(img => path.basename(img.url))
        );

        // 3. Read uploads directory
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        const files = await fs.readdir(uploadsDir);

        let deletedCount = 0;

        // 4. Delete orphan files
        for (const file of files) {
            // Skip .gitkeep or other system files if needed, though usually safe to delete images
            if (file === '.gitkeep') continue;

            if (!dbFiles.has(file)) {
                await fs.unlink(path.join(uploadsDir, file));
                deletedCount++;
            }
        }

        return { success: true, count: deletedCount };
    } catch (error) {
        console.error("Cleanup error:", error);
        return { success: false, error: "Error during cleanup" };
    }
}
