import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

import { redirect } from "next/navigation";
import Checklist from "@/components/Checklist";

export default async function FoodCheckPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const prisma = new PrismaClient();
    const items = await prisma.checklistItem.findMany({
        where: {
            userId: session.userId as number,
            type: "FOOD",
        },
        orderBy: { createdAt: "asc" },
    });

    return <Checklist title="Despensa & Comida 🍎" type="FOOD" items={items} />;
}
