"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "./prisma";
import sharp from "sharp";
import path from "path";
import { revalidatePath } from "next/cache";
import { SpotCategory } from "@/lib/types";
import bcrypt from "bcryptjs";

export async function createSpot(formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) {
        redirect("/login");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as SpotCategory;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const rating = parseInt(formData.get("rating") as string) || 0;
    const isFree = formData.get("isFree") === "true";
    const places = parseInt(formData.get("places") as string) || 1;

    // Handle Images
    const files = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (const file of files) {
        if (file.size > 0 && file.type.startsWith("image/")) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `spot-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
            const uploadPath = path.join(process.cwd(), "public/uploads", filename);

            try {
                await sharp(buffer)
                    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(uploadPath);

                imageUrls.push(`/uploads/${filename}`);
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    }

    // Handle Services
    const services = formData.getAll("services") as string[];

    await prisma.spot.create({
        data: {
            title,
            description,
            category,
            latitude,
            longitude,
            rating,
            isFree,
            places,
            authorId: session.userId as number,
            images: {
                create: imageUrls.map((url) => ({ url })),
            },
            // Create SpotServices
            services: {
                create: services.map((name) => ({
                    service: {
                        connectOrCreate: {
                            where: { name },
                            create: { name, icon: "Check" } // Default icon
                        }
                    }
                }))
            }
        },
    });

    revalidatePath("/");
    revalidatePath("/");
    // Navigation is handled by the client
}

export async function updateSpot(id: number, formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    const spot = await prisma.spot.findUnique({
        where: { id },
    });

    if (!spot) return { success: false, error: "Spot not found" };
    if (spot.authorId !== session.userId && session.role !== "ADMIN") {
        return { success: false, error: "Forbidden" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as SpotCategory;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const rating = parseInt(formData.get("rating") as string) || 0;
    const isFree = formData.get("isFree") === "true";
    const places = parseInt(formData.get("places") as string) || 1;

    // Handle Images
    const files = formData.getAll("images") as File[];
    const existingImageUrls = formData.getAll("existingImages") as string[];
    const newImageUrls: string[] = [];

    for (const file of files) {
        if (file.size > 0 && file.type.startsWith("image/")) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `spot-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
            const uploadPath = path.join(process.cwd(), "public/uploads", filename);

            try {
                await sharp(buffer)
                    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(uploadPath);

                newImageUrls.push(`/uploads/${filename}`);
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    }

    // Handle Services
    const services = formData.getAll("services") as string[];

    await prisma.$transaction(async (tx) => {
        // Update basic info and services
        await tx.spot.update({
            where: { id },
            data: {
                title,
                description,
                category,
                latitude,
                longitude,
                rating,
                isFree,
                places,
                services: {
                    deleteMany: {},
                    create: services.map((name) => ({
                        service: {
                            connectOrCreate: {
                                where: { name },
                                create: { name, icon: "Check" }
                            }
                        }
                    }))
                }
            }
        });

        // Update images: delete those not in existingImageUrls and add new ones
        await tx.spotImage.deleteMany({
            where: {
                spotId: id,
                url: { notIn: existingImageUrls }
            }
        });

        if (newImageUrls.length > 0) {
            await tx.spotImage.createMany({
                data: newImageUrls.map(url => ({ spotId: id, url }))
            });
        }
    });

    revalidatePath("/");
    return { success: true };
}

export async function getSpots() {
    const session = await getSession();
    const userId = session?.userId as number | undefined;

    const spots = await prisma.spot.findMany({
        include: {
            images: true,
            services: { include: { service: true } },
            favoritedBy: userId ? { where: { userId } } : false
        },
        orderBy: { createdAt: "desc" }
    });

    // Map to include a boolean isFavorite
    return spots.map(spot => ({
        ...spot,
        isFavorite: spot.favoritedBy ? spot.favoritedBy.length > 0 : false
    }));
}

export async function toggleFavorite(spotId: number) {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const userId = session.userId as number;

    const existing = await prisma.favorite.findUnique({
        where: { userId_spotId: { userId, spotId } }
    });

    if (existing) {
        await prisma.favorite.delete({
            where: { userId_spotId: { userId, spotId } }
        });
        revalidatePath("/");
        return { success: true, favorited: false };
    } else {
        await prisma.favorite.create({
            data: { userId, spotId }
        });
        revalidatePath("/");
        return { success: true, favorited: true };
    }
}

export async function getUserFavorites() {
    const session = await getSession();
    if (!session || !session.userId) return [];

    const favorites = await prisma.favorite.findMany({
        where: { userId: session.userId as number },
        select: { spotId: true }
    });

    return favorites.map(f => f.spotId);
}

export async function logout() {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/login");
}

export async function addChecklistItem(text: string, type: "FOOD" | "GEAR") {
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.checklistItem.create({
        data: {
            text,
            type,
            userId: session.userId as number,
        },
    });

    // Determine path based on type for revalidation
    const path = type === "FOOD" ? "/food-check" : "/gear-check";
    revalidatePath(path);
}

export async function toggleChecklistItem(id: number, checked: boolean, type: "FOOD" | "GEAR") {
    const session = await getSession();
    if (!session) redirect("/login");

    const item = await prisma.checklistItem.findUnique({ where: { id } });
    if (!item || item.userId !== session.userId) return;

    await prisma.checklistItem.update({
        where: { id },
        data: { checked },
    });

    const path = type === "FOOD" ? "/food-check" : "/gear-check";
    revalidatePath(path);
}

export async function deleteChecklistItem(id: number, type: "FOOD" | "GEAR") {
    const session = await getSession();
    if (!session) redirect("/login");

    const item = await prisma.checklistItem.findUnique({ where: { id } });
    if (!item || item.userId !== session.userId) return;

    await prisma.checklistItem.delete({ where: { id } });

    const path = type === "FOOD" ? "/food-check" : "/gear-check";
    revalidatePath(path);
}


export async function resetChecklistItems(type: "FOOD" | "GEAR") {
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.checklistItem.updateMany({
        where: {
            userId: session.userId as number,
            type,
        },
        data: { checked: false },
    });

    const path = type === "FOOD" ? "/food-check" : "/gear-check";
    revalidatePath(path);
}

export async function deleteSpot(id: number) {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const spot = await prisma.spot.findUnique({
        where: { id },
        select: { authorId: true }
    });

    if (!spot) return { success: false, error: "Spot not found" };

    // Only author or admin can delete
    if (spot.authorId !== session.userId && session.role !== "ADMIN") {
        return { success: false, error: "Forbidden" };
    }

    try {
        await prisma.spot.delete({
            where: { id }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error deleting spot:", error);
        return { success: false, error: "Internal server error" };
    }
}

export async function updateProfile(formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const name = formData.get("name") as string;
    const username = formData.get("username") as string;

    if (!username) return { success: false, error: "Username is required" };

    try {
        await prisma.user.update({
            where: { id: session.userId as number },
            data: { name, username }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Update profile error:", error);
        return { success: false, error: "Error updating profile (username might be taken)" };
    }
}

export async function changePassword(formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, error: "Todos los campos son obligatorios" };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, error: "Las contraseñas nuevas no coinciden" };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId as number }
    });

    if (!user) return { success: false, error: "Usuario no encontrado" };

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        return { success: false, error: "La contraseña actual es incorrecta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: session.userId as number },
        data: { password: hashedPassword }
    });

    return { success: true };
}
