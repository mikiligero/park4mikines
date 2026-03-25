import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Checklist from "@/components/Checklist";

export const dynamic = 'force-dynamic';

export default async function DynamicListPage({ params }: { params: Promise<{ type: string }> }) {
    const session = await getSession();
    if (!session) redirect("/login");

    const userId = session.userId as number;
    const resolvedParams = await params;
    const typeUpper = resolvedParams.type.toUpperCase();

    const listConfig = await prisma.configurableList.findUnique({
        where: { type: typeUpper }
    });

    if (!listConfig) {
        notFound();
    }

    const [items, categories] = await Promise.all([
        prisma.checklistItem.findMany({
            where: { userId, type: typeUpper },
            orderBy: { createdAt: "asc" },
        }),
        prisma.checklistCategory.findMany({
            where: { userId, type: typeUpper },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    // The old ones have icons in the title like "🍎" so let's just pass the name
    return <Checklist title={listConfig.name} type={typeUpper} items={items} categories={categories} />;
}
