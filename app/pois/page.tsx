import MapLazy from "@/components/map/MapLazy";
import { getSpots, getPernoctas } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import AddSpotFAB from "@/components/AddSpotFAB";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [spots, pernoctas] = await Promise.all([
        getSpots(),
        getPernoctas()
    ]);
    const session = await getSession();

    return (
        <main className="relative h-screen w-full overflow-hidden">
            <MapLazy spots={spots} pernoctas={pernoctas} />

            <AddSpotFAB isLoggedIn={!!session} />
        </main>
    );
}
