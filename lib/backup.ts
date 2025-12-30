"use server";

import prisma from "./prisma";
import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function createBackup() {
    const session = await getSession();
    if (!session || !session.userId) {
        if (!session?.userId) return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Fetch all data
        const users = await prisma.user.findMany();
        const spots = await prisma.spot.findMany();
        const spotImages = await prisma.spotImage.findMany();
        const services = await prisma.service.findMany();
        const spotServices = await prisma.spotService.findMany();
        const favorites = await prisma.favorite.findMany();
        const checklistItems = await prisma.checklistItem.findMany();

        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                users,
                spots,
                spotImages,
                services,
                spotServices,
                favorites,
                checklistItems
            }
        };

        // 2. Create ZIP
        const zip = new AdmZip();

        // Add JSON data
        zip.addFile("backup.json", Buffer.from(JSON.stringify(backupData, null, 2), "utf8"));

        // Add Images
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        try {
            const files = await fs.readdir(uploadsDir);
            for (const file of files) {
                if (file === '.gitkeep') continue;
                const filePath = path.join(uploadsDir, file);
                const content = await fs.readFile(filePath);
                zip.addFile(`uploads/${file}`, content);
            }
        } catch (e) {
            console.error("Error adding images to backup:", e);
        }

        const buffer = zip.toBuffer();

        // Return as base64 to download on client, or handle download via API route
        // Since server actions can't easily stream a file download directly to browser 
        // without a wrapper/hack or route handler, we will return base64 for small-medium apps
        // or write to a temp file and return ID. 
        // For simplicity in this stack, let's return base64 string.
        return { success: true, base64: buffer.toString('base64') };

    } catch (error) {
        console.error("Backup error:", error);
        return { success: false, error: "Error creating backup" };
    }
}

export async function restoreBackup(formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    if (session.role !== "ADMIN") {
        return { success: false, error: "Forbidden: Admin only" };
    }

    const file = formData.get("backupFile") as File;
    if (!file) return { success: false, error: "No file provided" };

    const logs: string[] = [];
    const log = (msg: string) => {
        const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
        logs.push(`[${time}] ${msg}`);
    };

    try {
        log("Iniciando proceso de restauración...");
        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // 1. Extract and Parse JSON
        const jsonEntry = zipEntries.find(entry => entry.entryName === "backup.json");
        if (!jsonEntry) return { success: false, error: "Invalid backup: missing backup.json" };

        log("Extrayendo archivo backup.json...");
        const backupData = JSON.parse(jsonEntry.getData().toString("utf8"));
        const { data } = backupData;

        log(`Versión del backup: ${backupData.version || 1}`);
        log(`Fecha del backup: ${backupData.timestamp || 'Desconocida'}`);

        // 2. Transactional Restore
        log("Iniciando transacción de base de datos...");

        await prisma.$transaction(async (tx) => {
            // Delete everything first - Order matters for foreign keys
            log("Limpiando base de datos actual...");
            await tx.checklistItem.deleteMany();
            await tx.favorite.deleteMany();
            await tx.spotService.deleteMany();
            await tx.spotImage.deleteMany();
            await tx.spot.deleteMany();
            await tx.service.deleteMany();
            await tx.user.deleteMany();

            // Insert new data
            // Users
            if (data.users && data.users.length > 0) {
                log(`Restaurando ${data.users.length} usuarios...`);
                await tx.user.createMany({ data: data.users });
            }

            // Services
            if (data.services && data.services.length > 0) {
                log(`Restaurando ${data.services.length} servicios...`);
                await tx.service.createMany({ data: data.services });
            }

            // Spots
            if (data.spots && data.spots.length > 0) {
                log(`Restaurando ${data.spots.length} sitios...`);
                // fix dates
                const spots = data.spots.map((s: any) => ({
                    ...s,
                    createdAt: new Date(s.createdAt),
                    updatedAt: new Date(s.updatedAt)
                }));
                await tx.spot.createMany({ data: spots });
            }

            // SpotImages
            if (data.spotImages && data.spotImages.length > 0) {
                log(`Restaurando ${data.spotImages.length} imágenes...`);
                await tx.spotImage.createMany({ data: data.spotImages });
            }

            // SpotServices
            if (data.spotServices && data.spotServices.length > 0) {
                log(`Restaurando relaciones de servicios...`);
                await tx.spotService.createMany({ data: data.spotServices });
            }

            // Favorites
            if (data.favorites && data.favorites.length > 0) {
                log(`Restaurando favoritos...`);
                await tx.favorite.createMany({ data: data.favorites });
            }

            // ChecklistItems
            if (data.checklistItems && data.checklistItems.length > 0) {
                log(`Restaurando ${data.checklistItems.length} items de checklist...`);
                const items = data.checklistItems.map((i: any) => ({
                    ...i,
                    createdAt: new Date(i.createdAt)
                }));
                await tx.checklistItem.createMany({ data: items });
            }
        });

        log("Base de datos restaurada correctamente.");

        // 3. Restore Images
        log("Restaurando archivos de imagen...");
        const uploadsDir = path.join(process.cwd(), "public/uploads");

        // Clean existing uploads? Maybe safer to keep then overwrite
        // Let's iterate zip entries for "uploads/"
        let imageCount = 0;
        for (const entry of zipEntries) {
            if (entry.entryName.startsWith("uploads/") && !entry.isDirectory) {
                const fileName = path.basename(entry.entryName);
                if (fileName) {
                    const content = entry.getData();
                    await fs.writeFile(path.join(uploadsDir, fileName), content);
                    imageCount++;
                }
            }
        }
        log(`Se han restaurado ${imageCount} archivos en /uploads.`);
        log("Proceso finalizado con éxito.");

        // revalidatePath("/"); // Removed to preventing component remounting/state loss on client. Client will reload manually.
        return { success: true, logs };

    } catch (error: any) {
        console.error("Restore error:", error);
        log(`ERROR CRÍTICO: ${error.message || error}`);
        return { success: false, error: "Error restoring backup", logs };
    }
}
