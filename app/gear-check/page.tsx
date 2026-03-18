import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Checklist from "@/components/Checklist";

export const dynamic = 'force-dynamic';

export default async function GearCheckPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const userId = session.userId as number;

    const [items, categories] = await Promise.all([
        prisma.checklistItem.findMany({
            where: { userId, type: "GEAR" },
            orderBy: { createdAt: "asc" },
        }),
        prisma.checklistCategory.findMany({
            where: { userId, type: "GEAR" },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    return <Checklist title="Equipamiento & Ropa 🎒" type="GEAR" items={items} categories={categories} />;
}
