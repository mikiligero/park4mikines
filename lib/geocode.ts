/**
 * Resolves a human-readable location name from GPS coordinates using
 * the Nominatim API (OpenStreetMap). Free, no API key required.
 * Returns null on error or if no result is found.
 */
export interface GeocodeResult {
    locationName: string | null;
    province: string | null;
    country: string | null;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Park4Mikines/1.0 (caravan-app)",
            },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const addr = data.address;
        if (!addr) return null;

        const city = addr.village || addr.town || addr.municipality || addr.city;
        // In Spain: addr.province = "Madrid", "Jaén", "Toledo"
        //           addr.state    = "Comunidad de Madrid", "Andalucía" (CCAA)
        const province = addr.province || addr.state || addr.county || null;
        const country = addr.country || null;

        // Build display name: "Portillo de Toledo, Toledo, España"
        const displayParts: string[] = [];
        if (city) displayParts.push(city);
        
        const displayRegion = addr.province || addr.state || addr.county;
        if (displayRegion && displayRegion !== city) displayParts.push(displayRegion);
        
        if (country) displayParts.push(country);
        
        if (displayParts.length === 0 && country) displayParts.push(country); // Fallback

        return {
            locationName: displayParts.length > 0 ? displayParts.join(", ") : null,
            province: province || null,
            country: country || null,
        };
    } catch {
        return null;
    }
}
