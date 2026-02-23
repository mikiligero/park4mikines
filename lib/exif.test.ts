import { describe, it, expect, vi } from 'vitest';
import { getGPSFromImage } from './exif';
import ExifReader from 'exifreader';

// Mock ExifReader
vi.mock('exifreader', () => ({
    default: {
        load: vi.fn(),
    },
}));

describe('getGPSFromImage', () => {
    it('returns null if no tags are found', async () => {
        vi.mocked(ExifReader.load).mockResolvedValueOnce({});
        const result = await getGPSFromImage(new File([], 'test.jpg'));
        expect(result).toBeNull();
    });

    it('parses decimal tags from description (Norte/Este)', async () => {
        vi.mocked(ExifReader.load).mockResolvedValueOnce({
            GPSLatitude: { description: '40.416775' },
            GPSLongitude: { description: '3.703790' },
            GPSLatitudeRef: { value: ['N'] },
            GPSLongitudeRef: { value: ['E'] },
        } as any);

        const result = await getGPSFromImage(new File([], 'test.jpg'));
        expect(result).toEqual({ lat: 40.416775, lon: 3.703790 });
    });

    it('parses decimal tags and applies South/West negative signs', async () => {
        vi.mocked(ExifReader.load).mockResolvedValueOnce({
            GPSLatitude: { description: '40.416775' },
            GPSLongitude: { description: '3.703790' },
            GPSLatitudeRef: { value: ['S'] }, // Sur -> negativo
            GPSLongitudeRef: { value: ['W'] }, // Oeste -> negativo
        } as any);

        const result = await getGPSFromImage(new File([], 'test.jpg'));
        expect(result).toEqual({ lat: -40.416775, lon: -3.703790 });
    });

    it('parses numerical descriptions correctly', async () => {
        vi.mocked(ExifReader.load).mockResolvedValueOnce({
            GPSLatitude: { description: 40.5 },
            GPSLongitude: { description: 3.5 },
            GPSLatitudeRef: { value: ['N'] },
            GPSLongitudeRef: { value: ['E'] },
        } as any);

        const result = await getGPSFromImage(new File([], 'test.jpg'));
        expect(result).toEqual({ lat: 40.5, lon: 3.5 });
    });

    it('parses DMS format coordinates correctly', async () => {
        // 40° 25' 0.39" N = 40 + 25/60 + 0.39/3600 = ~40.416775
        // 3° 42' 13.6" W = 3 + 42/60 + 13.6/3600 = ~3.703777
        vi.mocked(ExifReader.load).mockResolvedValueOnce({
            GPSLatitude: {
                value: [
                    { numerator: 40, denominator: 1 },
                    { numerator: 25, denominator: 1 },
                    { numerator: 39, denominator: 100 },
                ]
            },
            GPSLongitude: {
                value: [
                    { numerator: 3, denominator: 1 },
                    { numerator: 42, denominator: 1 },
                    { numerator: 136, denominator: 10 },
                ]
            },
            GPSLatitudeRef: { description: 'North' },
            GPSLongitudeRef: { description: 'West' },
        } as any);

        const result = await getGPSFromImage(new File([], 'test.jpg'));
        expect(result).toBeDefined();
        // Allow for small float precision differences
        expect(result!.lat).toBeCloseTo(40.416775, 5);
        expect(result!.lon).toBeCloseTo(-3.703777, 5); // West is negative!
    });
});
