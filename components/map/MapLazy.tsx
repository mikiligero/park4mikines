/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando mapa...</span>
        </div>
    ),
});

export default function MapLazy(props: any) {
    return <Map {...props} />;
}
