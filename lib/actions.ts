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

    revalidatePath("/pois");
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

    revalidatePath("/pois");
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
        revalidatePath("/pois");
        return { success: true, favorited: false };
    } else {
        await prisma.favorite.create({
            data: { userId, spotId }
        });
        revalidatePath("/pois");
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

export async function addChecklistItem(text: string, type: string, categoryId?: number | null) {
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.checklistItem.create({
        data: {
            text,
            type: type.toUpperCase(),
            userId: session.userId as number,
            ...(categoryId ? { categoryId } : {}),
        },
    });

    revalidatePath(`/lists/${type.toLowerCase()}`);
}

export async function toggleChecklistItem(id: number, checked: boolean, type: string) {
    const session = await getSession();
    if (!session) redirect("/login");

    const item = await prisma.checklistItem.findUnique({ where: { id } });
    if (!item || item.userId !== session.userId) return;

    await prisma.checklistItem.update({
        where: { id },
        data: { checked },
    });

    revalidatePath(`/lists/${type.toLowerCase()}`);
}

export async function deleteChecklistItem(id: number, type: string) {
    const session = await getSession();
    if (!session) redirect("/login");

    const item = await prisma.checklistItem.findUnique({ where: { id } });
    if (!item || item.userId !== session.userId) return;

    await prisma.checklistItem.delete({ where: { id } });

    revalidatePath(`/lists/${type.toLowerCase()}`);
}


export async function resetChecklistItems(type: string, categoryId?: number | null) {
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.checklistItem.updateMany({
        where: {
            userId: session.userId as number,
            type: type.toUpperCase(),
            ...(categoryId ? { categoryId } : {}),
        },
        data: { checked: false },
    });

    revalidatePath(`/lists/${type.toLowerCase()}`);
}

export async function addChecklistCategory(name: string, type: string) {
    const session = await getSession();
    if (!session) redirect("/login");

    const category = await prisma.checklistCategory.create({
        data: {
            name,
            type: type.toUpperCase(),
            userId: session.userId as number,
        },
    });

    revalidatePath(`/lists/${type.toLowerCase()}`);
    return category;
}

export async function deleteChecklistCategory(id: number, type: string) {
    const session = await getSession();
    if (!session) redirect("/login");

    const category = await prisma.checklistCategory.findUnique({ where: { id } });
    if (!category || category.userId !== (session.userId as number)) return;

    await prisma.checklistCategory.delete({ where: { id } });

    revalidatePath(`/lists/${type.toLowerCase()}`);
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
        revalidatePath("/pois");
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

// ─── Pernoctas ─────────────────────────────────────────────────────────────
import { reverseGeocode } from "./geocode";

export async function addPernocta(data: {
    date: string;
    latitude: number;
    longitude: number;
    notes?: string;
    weather?: string;
    cost?: number;
    spotId?: number | null;
}) {
    const session = await getSession();
    if (!session) redirect("/login");

    const geo = await reverseGeocode(data.latitude, data.longitude);

    await prisma.pernocta.create({
        data: {
            date: new Date(data.date),
            latitude: data.latitude,
            longitude: data.longitude,
            notes: data.notes || null,
            weather: data.weather || null,
            cost: data.cost ?? 0,
            locationName: geo?.locationName || null,
            province: geo?.province || null,
            country: geo?.country || null,
            spotId: data.spotId || null,
            userId: session.userId as number,
        },
    });

    revalidatePath("/pernoctas");
}

export async function updatePernocta(id: number, data: {
    date: string;
    latitude: number;
    longitude: number;
    notes?: string;
    weather?: string;
    cost?: number;
    spotId?: number | null;
}) {
    const session = await getSession();
    if (!session) redirect("/login");

    const pernocta = await prisma.pernocta.findUnique({ where: { id } });
    if (!pernocta || pernocta.userId !== (session.userId as number)) return;

    const geo = await reverseGeocode(data.latitude, data.longitude);

    await prisma.pernocta.update({
        where: { id },
        data: {
            date: new Date(data.date),
            latitude: data.latitude,
            longitude: data.longitude,
            notes: data.notes || null,
            weather: data.weather || null,
            cost: data.cost ?? 0,
            locationName: geo?.locationName || null,
            province: geo?.province || null,
            country: geo?.country || null,
            spotId: data.spotId || null,
        },
    });

    revalidatePath("/pernoctas");
}

export async function deletePernocta(id: number) {
    const session = await getSession();
    if (!session) redirect("/login");

    const pernocta = await prisma.pernocta.findUnique({ where: { id } });
    if (!pernocta || pernocta.userId !== (session.userId as number)) return;

    await prisma.pernocta.delete({ where: { id } });
    revalidatePath("/pernoctas");
}

export async function getPernoctas() {
    const session = await getSession();
    if (!session) return [];

    const userId = session.userId as number;
    const pernoctas = await prisma.pernocta.findMany({
        where: { userId },
        orderBy: { date: "desc" },
    });

    return pernoctas.map((p) => ({
        ...p,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
    }));
}

// ─── Configurable Lists ──────────────────────────────────────────────────

export async function createList(data: { name: string; type: string; icon: string; isVisible: boolean }) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    try {
        await prisma.configurableList.create({
            data: {
                name: data.name,
                type: data.type.toUpperCase().replace(/\s+/g, "_"),
                icon: data.icon,
                isVisible: data.isVisible,
            },
        });
        revalidatePath("/settings");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error creating list:", error);
        return { success: false, error: "Error al crear la lista. El tipo podría ya existir." };
    }
}

export async function updateList(id: number, data: { name: string; icon: string }) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    try {
        await prisma.configurableList.update({
            where: { id },
            data: {
                name: data.name,
                icon: data.icon,
            },
        });
        revalidatePath("/settings");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating list:", error);
        return { success: false, error: "Error al actualizar la lista." };
    }
}

export async function toggleListVisibility(id: number, isVisible: boolean) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    try {
        await prisma.configurableList.update({
            where: { id },
            data: { isVisible },
        });
        revalidatePath("/settings");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error toggling list visibility:", error);
        return { success: false, error: "Error al cambiar la visibilidad." };
    }
}

export async function deleteList(id: number) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    try {
        const listToDelete = await prisma.configurableList.findUnique({
            where: { id },
        });

        if (!listToDelete) {
            return { success: false, error: "Lista no encontrada." };
        }

        await prisma.$transaction([
            prisma.checklistItem.deleteMany({ where: { type: listToDelete.type } }),
            prisma.checklistCategory.deleteMany({ where: { type: listToDelete.type } }),
            prisma.configurableList.delete({ where: { id } }),
        ]);

        revalidatePath("/settings");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error deleting list:", error);
        return { success: false, error: "Error al eliminar la lista y sus elementos." };
    }
}

export async function getVisibleLists() {
    return prisma.configurableList.findMany({
        where: { isVisible: true },
        orderBy: { createdAt: "asc" }
    });
}
