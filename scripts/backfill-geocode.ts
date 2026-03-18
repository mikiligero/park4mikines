/**
 * One-off script to backfill province/country on existing pernoctas.
 * Run with: npx ts-node --project tsconfig.json scripts/backfill-geocode.ts
 */
import prisma from "../lib/prisma";
import { reverseGeocode } from "../lib/geocode";

async function main() {
    const pernoctas = await prisma.pernocta.findMany();
    console.log(`Backfilling ${pernoctas.length} pernoctas...`);

    for (const p of pernoctas) {
        const geo = await reverseGeocode(p.latitude, p.longitude);
        if (!geo) {
            console.log(`  [${p.id}] Could not geocode`);
            continue;
        }
        await prisma.pernocta.update({
            where: { id: p.id },
            data: {
                locationName: geo.locationName,
                province: geo.province,
                country: geo.country,
            },
        });
        console.log(`  [${p.id}] → ${geo.locationName} | ${geo.province} | ${geo.country}`);
        // Nominatim rate limit: 1 req/sec
        await new Promise((res) => setTimeout(res, 1100));
    }
    console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
