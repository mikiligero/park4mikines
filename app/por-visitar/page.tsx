import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getVisitPlaces } from "@/lib/visit-actions";
import VisitPlaces from "@/components/VisitPlaces";

export const dynamic = "force-dynamic";

export default async function VisitPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
    const session = await getSession();
    if (!session?.userId) redirect("/login");
    const [places, types] = await Promise.all([
        getVisitPlaces(),
        prisma.visitType.findMany({ orderBy: { id: "asc" } }),
    ]);
    const { estado } = await searchParams;
    return <VisitPlaces key={estado || "pending"} places={places} types={types} userId={Number(session.userId)} isAdmin={session.role === "ADMIN"} initialStatus={estado === "todos" ? "all" : "pending"} />;
}
