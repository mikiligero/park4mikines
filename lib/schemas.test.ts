import { describe, it, expect } from 'vitest';
import { loginSchema, spotSchema, pernoctaSchema } from './schemas';

// ── loginSchema ───────────────────────────────────────────────────────────────

describe('loginSchema', () => {
    it('acepta credenciales válidas', () => {
        expect(loginSchema.safeParse({ username: 'mikines', password: 'secreto' }).success).toBe(true);
    });

    it('rechaza username vacío', () => {
        expect(loginSchema.safeParse({ username: '', password: 'pass' }).success).toBe(false);
    });

    it('rechaza password vacío', () => {
        expect(loginSchema.safeParse({ username: 'user', password: '' }).success).toBe(false);
    });

    it('rechaza username de más de 64 caracteres', () => {
        expect(loginSchema.safeParse({ username: 'a'.repeat(65), password: 'pass' }).success).toBe(false);
    });

    it('rechaza password de más de 256 caracteres', () => {
        expect(loginSchema.safeParse({ username: 'user', password: 'a'.repeat(257) }).success).toBe(false);
    });
});

// ── pernoctaSchema ────────────────────────────────────────────────────────────

describe('pernoctaSchema', () => {
    const valid = { date: '2024-07-20', latitude: 40.416, longitude: -3.703 };

    it('acepta datos mínimos válidos', () => {
        expect(pernoctaSchema.safeParse(valid).success).toBe(true);
    });

    it('acepta todos los campos opcionales', () => {
        const result = pernoctaSchema.safeParse({ ...valid, notes: 'Bonito', weather: 'Soleado', cost: 5 });
        expect(result.success).toBe(true);
    });

    it('rechaza formato de fecha incorrecto', () => {
        expect(pernoctaSchema.safeParse({ ...valid, date: '20/07/2024' }).success).toBe(false);
        expect(pernoctaSchema.safeParse({ ...valid, date: 'ayer' }).success).toBe(false);
    });

    it('rechaza latitud fuera de rango [-90, 90]', () => {
        expect(pernoctaSchema.safeParse({ ...valid, latitude: 91 }).success).toBe(false);
        expect(pernoctaSchema.safeParse({ ...valid, latitude: -91 }).success).toBe(false);
    });

    it('rechaza longitud fuera de rango [-180, 180]', () => {
        expect(pernoctaSchema.safeParse({ ...valid, longitude: 181 }).success).toBe(false);
        expect(pernoctaSchema.safeParse({ ...valid, longitude: -181 }).success).toBe(false);
    });

    it('rechaza coste negativo', () => {
        expect(pernoctaSchema.safeParse({ ...valid, cost: -1 }).success).toBe(false);
    });

    it('acepta coste 0', () => {
        expect(pernoctaSchema.safeParse({ ...valid, cost: 0 }).success).toBe(true);
    });
});

// ── spotSchema ────────────────────────────────────────────────────────────────

describe('spotSchema', () => {
    const valid = { title: 'Mirador del Lago', category: 'NATURE', latitude: 40.416, longitude: -3.703 };

    it('acepta datos válidos', () => {
        expect(spotSchema.safeParse(valid).success).toBe(true);
    });

    it('rechaza título vacío', () => {
        expect(spotSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
    });

    it('rechaza título de más de 200 caracteres', () => {
        expect(spotSchema.safeParse({ ...valid, title: 'a'.repeat(201) }).success).toBe(false);
    });

    it('rechaza categoría desconocida', () => {
        expect(spotSchema.safeParse({ ...valid, category: 'VOLCAN' }).success).toBe(false);
    });

    it('acepta todas las categorías del enum SpotCategory', () => {
        const cats = ['NATURE', 'PARKING_DN', 'REST_AREA', 'PICNIC', 'AC_FREE', 'AC_PAID', 'OFFROAD', 'CAMPING', 'SERVICE', 'PARKING_DAY', 'CANDIDATO'];
        for (const category of cats) {
            expect(spotSchema.safeParse({ ...valid, category }).success).toBe(true);
        }
    });

    it('rechaza rating fuera de [0, 5]', () => {
        expect(spotSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
        expect(spotSchema.safeParse({ ...valid, rating: -1 }).success).toBe(false);
    });

    it('acepta rating 0 por defecto', () => {
        const result = spotSchema.safeParse(valid);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.rating).toBe(0);
    });

    it('rechaza latitud fuera de rango', () => {
        expect(spotSchema.safeParse({ ...valid, latitude: 91 }).success).toBe(false);
    });

    it('rechaza descripción de más de 2000 caracteres', () => {
        expect(spotSchema.safeParse({ ...valid, description: 'a'.repeat(2001) }).success).toBe(false);
    });
});
