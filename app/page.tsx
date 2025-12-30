import MapLazy from "@/components/map/MapLazy";
import { Plus } from "lucide-react";
import Link from "next/link";
import { logout } from "@/lib/actions";
import { getSpots } from "@/lib/actions";

export default async function Home() {
    const spots = await getSpots();

    return (
        <main className="relative h-screen w-full overflow-hidden">
            <MapLazy spots={spots} />


            {/* Floating Action Button */}
            <Link
                href="/add"
                className="absolute bottom-6 right-6 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <Plus className="h-8 w-8" />
            </Link>
        </main>
    );
}
