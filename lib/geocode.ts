/**
 * Resolves a human-readable location name from GPS coordinates using
 * the Google Geocoding API. The key remains server-side.
 * Returns null on error or if no result is found.
 */
import { logger } from "@/lib/logger";

export interface GeocodeResult {
    locationName: string | null;
    province: string | null;
    country: string | null;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
    try {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
        if (!apiKey) return null;

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${apiKey}`;
        const res = await fetch(url, {
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) return null;

        const data = await res.json();
        const components = data.results?.[0]?.address_components;
        if (!components) return null;

        const getComponent = (type: string) => components.find((component: any) => component.types.includes(type))?.long_name ?? null;
        const city = getComponent("locality") || getComponent("postal_town") || getComponent("administrative_area_level_3");
        const province = getComponent("administrative_area_level_2") || getComponent("administrative_area_level_1");
        const country = getComponent("country");

        const displayParts: string[] = [];
        if (city) displayParts.push(city);
        
        const displayRegion = province;
        if (displayRegion && displayRegion !== city) displayParts.push(displayRegion);
        
        if (country) displayParts.push(country);
        
        if (displayParts.length === 0 && country) displayParts.push(country); // Fallback

        return {
            locationName: displayParts.length > 0 ? displayParts.join(", ") : null,
            province: province || null,
            country: country || null,
        };
    } catch (error) {
        logger.warn("Geocoding failed", { lat, lon, error });
        return null;
    }
}
