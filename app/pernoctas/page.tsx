import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PernocatasClient from "./PernocatasClient";

export const dynamic = "force-dynamic";

export default async function PernocatasPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const userId = session.userId as number;

    const [pernoctas, spots] = await Promise.all([
        prisma.pernocta.findMany({
            where: { userId },
            orderBy: { date: "desc" },
            include: { spot: { select: { title: true } } },
        }),
        prisma.spot.findMany({
            where: { authorId: userId },
            select: { id: true, title: true },
            orderBy: { title: "asc" },
        }),
    ]);

    // Serialize dates for client component
    const serialized = pernoctas.map((p) => ({
        ...p,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
    }));

    return <PernocatasClient pernoctas={serialized} spots={spots} />;
}
