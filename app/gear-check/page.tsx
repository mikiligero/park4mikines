import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Checklist from "@/components/Checklist";

export const dynamic = 'force-dynamic';

export default async function GearCheckPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const items = await prisma.checklistItem.findMany({
        where: {
            userId: session.userId as number,
            type: "GEAR",
        },
        orderBy: { createdAt: "asc" },
    });

    return <Checklist title="Equipamiento & Ropa 🎒" type="GEAR" items={items} />;
}
