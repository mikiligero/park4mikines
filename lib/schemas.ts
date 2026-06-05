import { z } from "zod";
import { SpotCategory } from "@/lib/types";

export const loginSchema = z.object({
    username: z.string().min(1).max(64),
    password: z.string().min(1).max(256),
});

export const spotSchema = z.object({
    title: z.string().min(1, "El título es obligatorio").max(200),
    description: z.string().max(2000).optional(),
    category: z.nativeEnum(SpotCategory),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    rating: z.number().int().min(0).max(5).default(0),
    isFree: z.boolean().default(true),
    places: z.number().int().min(1).max(9999).default(1),
});

export const pernoctaSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Fecha inválida"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    notes: z.string().max(1000).optional(),
    weather: z.string().max(100).optional(),
    cost: z.number().min(0).max(99999).optional(),
});
