import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;

    if (!query || query.length < 2) return NextResponse.json({ places: [] });
    if (!apiKey) return NextResponse.json({ error: "Google Places no está configurado." }, { status: 503 });

    try {
        const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
            },
            body: JSON.stringify({
                textQuery: query,
                languageCode: "es",
                regionCode: "ES",
                pageSize: 5,
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) return NextResponse.json({ places: [] }, { status: response.status });

        const data = await response.json();
        const places = (data.places ?? []).flatMap((place: any) => {
            if (!place.location) return [];
            return [{
                displayName: place.formattedAddress || place.displayName?.text || query,
                lat: place.location.latitude,
                lng: place.location.longitude,
            }];
        });

        return NextResponse.json({ places });
    } catch {
        return NextResponse.json({ places: [] }, { status: 502 });
    }
}
