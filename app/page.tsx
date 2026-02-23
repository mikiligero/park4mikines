import MapLazy from "@/components/map/MapLazy";
import { getSpots } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import AddSpotFAB from "@/components/AddSpotFAB";

export const dynamic = "force-dynamic";

export default async function Home() {
    const spots = await getSpots();
    const session = await getSession();

    return (
        <main className="relative h-screen w-full overflow-hidden">
            <MapLazy spots={spots} />

            <AddSpotFAB isLoggedIn={!!session} />
        </main>
    );
}
