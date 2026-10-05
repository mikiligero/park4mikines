import MapLazy from "@/components/map/MapLazy";
import { getSpots, getPernoctas } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import AddSpotFAB from "@/components/AddSpotFAB";
import { getVisitPlaces } from "@/lib/visit-actions";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
    const session = await getSession();
    const [spots, pernoctas, visits, visitTypes] = await Promise.all([
        getSpots(),
        getPernoctas(),
        getVisitPlaces(),
        session?.userId ? prisma.visitType.findMany({ orderBy: { id: "asc" } }) : Promise.resolve([]),
    ]);

    return (
        <main className="relative h-screen w-full overflow-hidden">
            <MapLazy spots={spots} pernoctas={pernoctas} visits={visits} visitTypes={visitTypes} userId={Number(session?.userId) || null} isAdmin={session?.role === "ADMIN"} />

            <AddSpotFAB isLoggedIn={!!session} />
        </main>
    );
}
