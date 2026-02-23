import ExifReader from 'exifreader';

export async function getGPSFromImage(file: File): Promise<{ lat: number, lon: number } | null> {
    try {
        const tags = await ExifReader.load(file);
        console.log("EXIF Tags found:", tags);

        // Helper to get decimal from ExifReader tag
        const getDecimal = (tag: any): number | null => {
            if (!tag) return null;

            // 1. Try description (recent ExifReader versions often provide decimal string here)
            if (tag.description && !isNaN(parseFloat(tag.description))) {
                return parseFloat(tag.description);
            }

            // 2. Try value (often array of fractions for DMS: [degrees, minutes, seconds])
            if (Array.isArray(tag.value) && tag.value.length >= 3) {
                const parseNum = (v: any) => {
                    if (typeof v === 'object' && v.numerator !== undefined && v.denominator !== undefined) {
                        return v.numerator / v.denominator;
                    }
                    return parseFloat(v);
                };

                const d = parseNum(tag.value[0]);
                const m = parseNum(tag.value[1]);
                const s = parseNum(tag.value[2]);

                if (!isNaN(d) && !isNaN(m) && !isNaN(s)) {
                    return d + (m / 60) + (s / 3600);
                }
            }

            return null;
        };

        let latVal = getDecimal(tags['GPSLatitude']);
        let lonVal = getDecimal(tags['GPSLongitude']);

        if (latVal !== null && lonVal !== null) {
            // Check References (N/S, E/W)
            const latRefTag = tags['GPSLatitudeRef'] as any;
            const lonRefTag = tags['GPSLongitudeRef'] as any;

            const latRef = String(latRefTag?.value?.[0] || latRefTag?.description || 'N').toUpperCase();
            const lonRef = String(lonRefTag?.value?.[0] || lonRefTag?.description || 'E').toUpperCase();

            console.log("Calculated Lat:", latVal, "Ref:", latRef, "| Lon:", lonVal, "Ref:", lonRef);

            if (latRef.startsWith('S')) latVal = -Math.abs(latVal);
            if (lonRef.startsWith('W')) lonVal = -Math.abs(lonVal);

            return { lat: latVal, lon: lonVal };
        }

        console.warn("Could not extract GPS coordinates from EXIF tags.");
    } catch (error) {
        console.error("Error reading EXIF data:", error);
    }
    return null;
}
