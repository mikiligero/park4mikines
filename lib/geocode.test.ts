import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reverseGeocode } from './geocode';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function googleResult(components: Array<{ types: string[]; long_name: string }>) {
    return { results: [{ address_components: components }] };
}

describe('reverseGeocode', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        process.env.GOOGLE_MAPS_SERVER_API_KEY = 'test-key';
    });

    it('devuelve null si fetch falla con status !== ok', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });
        const result = await reverseGeocode(40.0, -3.7);
        expect(result).toBeNull();
    });

    it('devuelve null si la respuesta no contiene resultados', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });
        const result = await reverseGeocode(40.0, -3.7);
        expect(result).toBeNull();
    });

    it('devuelve null si fetch lanza una excepción', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await reverseGeocode(40.0, -3.7);
        expect(result).toBeNull();
    });

    it('construye locationName con localidad, provincia y país', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => googleResult([
                { types: ['locality'], long_name: 'Portillo de Toledo' },
                { types: ['administrative_area_level_1'], long_name: 'Castilla-La Mancha' },
                { types: ['country'], long_name: 'España' },
            ]),
        });

        const result = await reverseGeocode(39.9, -4.0);
        expect(result).not.toBeNull();
        expect(result!.locationName).toBe('Portillo de Toledo, Castilla-La Mancha, España');
        expect(result!.province).toBe('Castilla-La Mancha');
        expect(result!.country).toBe('España');
    });

    it('construye locationName con postal_town cuando no hay locality', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => googleResult([
                { types: ['postal_town'], long_name: 'Aranjuez' },
                { types: ['administrative_area_level_2'], long_name: 'Madrid' },
                { types: ['country'], long_name: 'España' },
            ]),
        });

        const result = await reverseGeocode(40.03, -3.6);
        expect(result).not.toBeNull();
        expect(result!.locationName).toContain('Aranjuez');
        expect(result!.province).toBe('Madrid');
        expect(result!.country).toBe('España');
    });

    it('prioriza la provincia sobre la comunidad para locationName', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => googleResult([
                { types: ['locality'], long_name: 'Toledo' },
                { types: ['administrative_area_level_2'], long_name: 'Toledo' },
                { types: ['administrative_area_level_1'], long_name: 'Castilla-La Mancha' },
                { types: ['country'], long_name: 'España' },
            ]),
        });

        const result = await reverseGeocode(39.86, -4.02);
        expect(result).not.toBeNull();
        expect(result!.province).toBe('Toledo');
    });

    it('solo devuelve el país si no hay ciudad ni comunidad', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => googleResult([{ types: ['country'], long_name: 'España' }]),
        });

        const result = await reverseGeocode(40.0, -3.7);
        expect(result).not.toBeNull();
        expect(result!.locationName).toBe('España');
        expect(result!.country).toBe('España');
    });

    it('llama a la API de Google con las coordenadas correctas', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => googleResult([{ types: ['country'], long_name: 'España' }]),
        });

        await reverseGeocode(40.416, -3.703);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('latlng=40.416,-3.703'),
            expect.any(Object)
        );
    });
});
