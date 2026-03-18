import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reverseGeocode } from './geocode';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('reverseGeocode', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('devuelve null si fetch falla con status !== ok', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });
        const result = await reverseGeocode(40.0, -3.7);
        expect(result).toBeNull();
    });

    it('devuelve null si la respuesta no contiene address', async () => {
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

    it('construye locationName con village, estado y país', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                address: {
                    village: 'Portillo de Toledo',
                    state: 'Castilla-La Mancha',
                    country: 'España',
                },
            }),
        });

        const result = await reverseGeocode(39.9, -4.0);
        expect(result).not.toBeNull();
        expect(result!.locationName).toBe('Portillo de Toledo, Castilla-La Mancha, España');
        expect(result!.province).toBe('Castilla-La Mancha');
        expect(result!.country).toBe('España');
    });

    it('construye locationName con town cuando no hay village', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                address: {
                    town: 'Aranjuez',
                    province: 'Madrid',
                    country: 'España',
                },
            }),
        });

        const result = await reverseGeocode(40.03, -3.6);
        expect(result).not.toBeNull();
        expect(result!.locationName).toContain('Aranjuez');
        expect(result!.province).toBe('Madrid');
        expect(result!.country).toBe('España');
    });

    it('usa province antes que state para locationName', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                address: {
                    city: 'Toledo',
                    province: 'Toledo',
                    state: 'Castilla-La Mancha',
                    country: 'España',
                },
            }),
        });

        const result = await reverseGeocode(39.86, -4.02);
        expect(result).not.toBeNull();
        expect(result!.province).toBe('Toledo');
    });

    it('solo devuelve el país si no hay ciudad ni comunidad', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                address: {
                    country: 'España',
                },
            }),
        });

        const result = await reverseGeocode(40.0, -3.7);
        expect(result).not.toBeNull();
        expect(result!.locationName).toBe('España');
        expect(result!.country).toBe('España');
    });

    it('llama a la API de Nominatim con las coordenadas correctas', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ address: { country: 'España' } }),
        });

        await reverseGeocode(40.416, -3.703);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('lat=40.416'),
            expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('lon=-3.703'),
            expect.any(Object)
        );
    });
});
