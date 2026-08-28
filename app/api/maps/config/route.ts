import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const apiKey = process.env.GOOGLE_MAPS_BROWSER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Google Maps no está configurado." }, { status: 503 });

    return NextResponse.json({ apiKey }, {
        headers: { "Cache-Control": "private, no-store" },
    });
}
