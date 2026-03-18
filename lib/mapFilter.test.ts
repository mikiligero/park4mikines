/**
 * Tests para la lógica de filtrado del mapa (Map.tsx).
 * 
 * La lógica de filtrado de spots y pernoctas en el mapa está implementada
 * directamente en el componente React, por lo que aquí la extraemos y testeamos
 * de forma aislada como funciones puras.
 */
import { describe, it, expect } from 'vitest';

// ── Tipos mínimos ─────────────────────────────────────────────────────────────

interface Spot {
    id: number;
    latitude: number;
    longitude: number;
    category: string;
    rating: number;
    isFavorite: boolean;
    services: { service: { name: string } }[];
}

interface FilterState {
    showSpots: boolean;
    showPernoctas: boolean;
    showFavoritesOnly: boolean;
    selectedCategories: string[];
    selectedServices: string[];
    minRating: number;
}

// ── Función de filtrado (igual que en Map.tsx) ────────────────────────────────

function filterSpots(spots: Spot[], filter: FilterState): Spot[] {
    return spots.filter((spot) => {
        if (!filter.showSpots) return false;
        if (filter.showFavoritesOnly && !spot.isFavorite) return false;
        if (filter.selectedCategories.length > 0 && !filter.selectedCategories.includes(spot.category)) return false;
        if (filter.minRating > 0 && (spot.rating || 0) < filter.minRating) return false;
        if (filter.selectedServices.length > 0) {
            const spotServices = spot.services?.map((s) => s.service.name) || [];
            if (!filter.selectedServices.every((s) => spotServices.includes(s))) return false;
        }
        return true;
    });
}

// ── Datos de test ─────────────────────────────────────────────────────────────

const SPOTS: Spot[] = [
    {
        id: 1,
        latitude: 40.416,
        longitude: -3.703,
        category: 'NATURE',
        rating: 4,
        isFavorite: true,
        services: [{ service: { name: 'Agua' } }, { service: { name: 'Electricidad' } }],
    },
    {
        id: 2,
        latitude: 39.9,
        longitude: -4.0,
        category: 'PARKING',
        rating: 2,
        isFavorite: false,
        services: [{ service: { name: 'Agua' } }],
    },
    {
        id: 3,
        latitude: 41.0,
        longitude: -2.5,
        category: 'NATURE',
        rating: 5,
        isFavorite: false,
        services: [],
    },
];

const DEFAULT_FILTER: FilterState = {
    showSpots: true,
    showPernoctas: false,
    showFavoritesOnly: false,
    selectedCategories: [],
    selectedServices: [],
    minRating: 0,
};

// ── Tests: Visibilidad de Spots y Pernoctas ───────────────────────────────────

describe('Filtro de visibilidad: showSpots', () => {
    it('muestra todos los spots cuando showSpots=true y no hay otros filtros', () => {
        const result = filterSpots(SPOTS, DEFAULT_FILTER);
        expect(result).toHaveLength(3);
    });

    it('oculta todos los spots cuando showSpots=false', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, showSpots: false });
        expect(result).toHaveLength(0);
    });
});

// ── Tests: Estado inicial del filtro (navegación desde Pernoctas) ─────────────

describe('Estado inicial según ruta de navegación', () => {
    it('estado por defecto (Puntos de Interés): spots visibles, pernoctas ocultas', () => {
        const defaultState: FilterState = {
            showSpots: true,
            showPernoctas: false,
            showFavoritesOnly: false,
            selectedCategories: [],
            selectedServices: [],
            minRating: 0,
        };
        const result = filterSpots(SPOTS, defaultState);
        expect(defaultState.showSpots).toBe(true);
        expect(defaultState.showPernoctas).toBe(false);
        expect(result).toHaveLength(3);
    });

    it('estado de pernoctas (?pernoctas=true): spots ocultos, pernoctas visibles', () => {
        const pernocatasState: FilterState = {
            showSpots: false,
            showPernoctas: true,
            showFavoritesOnly: false,
            selectedCategories: [],
            selectedServices: [],
            minRating: 0,
        };
        const result = filterSpots(SPOTS, pernocatasState);
        expect(pernocatasState.showSpots).toBe(false);
        expect(pernocatasState.showPernoctas).toBe(true);
        expect(result).toHaveLength(0); // Spots ocultos
    });

    it('estado combinado (spots + pernoctas): ambos visibles desde filtros', () => {
        const combinedState: FilterState = {
            showSpots: true,
            showPernoctas: true,
            showFavoritesOnly: false,
            selectedCategories: [],
            selectedServices: [],
            minRating: 0,
        };
        const result = filterSpots(SPOTS, combinedState);
        expect(result).toHaveLength(3); // Todos los spots visibles
    });
});

// ── Tests: Solo Favoritos ─────────────────────────────────────────────────────

describe('Filtro: Solo Favoritos', () => {
    it('muestra sólo los spots marcados como favoritos', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, showFavoritesOnly: true });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('no filtra por favoritos cuando el toggle está desactivado', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, showFavoritesOnly: false });
        expect(result).toHaveLength(3);
    });
});

// ── Tests: Filtro por Categorías ──────────────────────────────────────────────

describe('Filtro: Categorías', () => {
    it('filtra solo spots de la categoría NATURE', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, selectedCategories: ['NATURE'] });
        expect(result).toHaveLength(2);
        expect(result.every((s) => s.category === 'NATURE')).toBe(true);
    });

    it('filtra solo spots de la categoría PARKING', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, selectedCategories: ['PARKING'] });
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('PARKING');
    });

    it('sin categorías seleccionadas muestra todos los spots', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, selectedCategories: [] });
        expect(result).toHaveLength(3);
    });
});

// ── Tests: Filtro por Valoración ──────────────────────────────────────────────

describe('Filtro: Valoración mínima', () => {
    it('muestra spots con valoración >= 4', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, minRating: 4 });
        expect(result).toHaveLength(2); // Spots 1 (rating 4) y 3 (rating 5)
        expect(result.every((s) => s.rating >= 4)).toBe(true);
    });

    it('muestra todos con valoración mínima 0', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, minRating: 0 });
        expect(result).toHaveLength(3);
    });

    it('muestra solo los spots con valoración máxima (5 estrellas)', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, minRating: 5 });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(3);
    });
});

// ── Tests: Filtro por Servicios ───────────────────────────────────────────────

describe('Filtro: Servicios', () => {
    it('muestra solo spots que tienen el servicio "Agua"', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, selectedServices: ['Agua'] });
        expect(result).toHaveLength(2); // Spots 1 y 2 tienen Agua
    });

    it('muestra solo spots que tienen todos los servicios requeridos', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, selectedServices: ['Agua', 'Electricidad'] });
        expect(result).toHaveLength(1); // Solo Spot 1 tiene ambos
        expect(result[0].id).toBe(1);
    });

    it('devuelve [] si ningún spot tiene todos los servicios requeridos', () => {
        const result = filterSpots(SPOTS, { ...DEFAULT_FILTER, selectedServices: ['WiFi'] });
        expect(result).toHaveLength(0);
    });
});

// ── Tests: Combinación de filtros ─────────────────────────────────────────────

describe('Filtros combinados', () => {
    it('combina correctamente categoría + valoración mínima', () => {
        const result = filterSpots(SPOTS, {
            ...DEFAULT_FILTER,
            selectedCategories: ['NATURE'],
            minRating: 5,
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(3);
    });

    it('combina favoritos + categoría', () => {
        const result = filterSpots(SPOTS, {
            ...DEFAULT_FILTER,
            showFavoritesOnly: true,
            selectedCategories: ['NATURE'],
        });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('showSpots=false sobreescribe todos los demás filtros', () => {
        const result = filterSpots(SPOTS, {
            showSpots: false,
            showPernoctas: true,
            showFavoritesOnly: true,
            selectedCategories: ['NATURE'],
            selectedServices: [],
            minRating: 0,
        });
        expect(result).toHaveLength(0);
    });
});
