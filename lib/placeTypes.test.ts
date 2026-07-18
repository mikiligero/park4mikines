import { describe, it, expect } from 'vitest';
import { getPlaceType, getSpotStatus, coverPhoto, getServiceIcon, DEFAULT_PHOTO, SPOT_SERVICES } from './placeTypes';

describe('getPlaceType', () => {
    it('returns the correct type for known categories', () => {
        expect(getPlaceType('NATURE').id).toBe('NATURE');
        expect(getPlaceType('CAMPING').short).toBe('Camping');
        expect(getPlaceType('CANDIDATO').color).toBe('#E2562A');
    });

    it('falls back to NATURE for unknown categories', () => {
        expect(getPlaceType('UNKNOWN').id).toBe('NATURE');
        expect(getPlaceType('').id).toBe('NATURE');
    });
});

describe('getSpotStatus', () => {
    it('returns "candidato" only for CANDIDATO', () => {
        expect(getSpotStatus('CANDIDATO')).toBe('candidato');
    });

    it('returns "verificado" for all other categories', () => {
        expect(getSpotStatus('NATURE')).toBe('verificado');
        expect(getSpotStatus('CAMPING')).toBe('verificado');
        expect(getSpotStatus('PARKING_DN')).toBe('verificado');
        expect(getSpotStatus('UNKNOWN')).toBe('verificado');
    });
});

describe('coverPhoto', () => {
    it('returns the first image URL when images are provided', () => {
        const images = [
            { url: 'https://example.com/photo1.jpg' },
            { url: 'https://example.com/photo2.jpg' },
        ];
        expect(coverPhoto(images)).toBe('https://example.com/photo1.jpg');
    });

    it('returns DEFAULT_PHOTO for an empty array', () => {
        expect(coverPhoto([])).toBe(DEFAULT_PHOTO);
    });

    it('returns DEFAULT_PHOTO when images is undefined', () => {
        expect(coverPhoto(undefined)).toBe(DEFAULT_PHOTO);
    });
});

describe('getServiceIcon', () => {
    it('returns correct icon for known services (case-insensitive)', () => {
        expect(getServiceIcon('Agua potable')).toBe('faucet');
        expect(getServiceIcon('AGUA POTABLE')).toBe('faucet');
        expect(getServiceIcon('Aguas grises')).toBe('greywater');
        expect(getServiceIcon('Aguas negras')).toBe('toilet');
        expect(getServiceIcon('Cubo de basura')).toBe('trash');
        expect(getServiceIcon('Baños públicos')).toBe('restroom');
        expect(getServiceIcon('Duchas (acceso posible)')).toBe('shower');
        expect(getServiceIcon('Electricidad (acceso posible)')).toBe('plug');
        expect(getServiceIcon('WIFI')).toBe('wifi');
        expect(getServiceIcon('Cobertura 5G')).toBe('signal');
        expect(getServiceIcon('Piscina')).toBe('pool');
        expect(getServiceIcon('Lavandería')).toBe('laundry');
        expect(getServiceIcon('Lavado de autocaravanas')).toBe('camperwash');
        expect(getServiceIcon('Se permiten mascotas')).toBe('pet');
        expect(getServiceIcon('Sombra')).toBe('sun');
        expect(getServiceIcon('Panadería')).toBe('bread');
    });

    it('returns "info" for unknown services', () => {
        expect(getServiceIcon('Servicio desconocido')).toBe('info');
        expect(getServiceIcon('')).toBe('info');
    });
});

describe('SPOT_SERVICES', () => {
    it('includes all selectable services, including Sombra', () => {
        expect(SPOT_SERVICES.map((service) => service.label)).toEqual([
            'Agua potable',
            'Aguas negras',
            'Aguas grises',
            'Cubo de basura',
            'Baños públicos',
            'Duchas (acceso posible)',
            'Electricidad (acceso posible)',
            'WIFI',
            'Cobertura 5G',
            'Piscina',
            'Lavandería',
            'Lavado de autocaravanas',
            'Se permiten mascotas',
            'Sombra',
            'Panadería',
        ]);
        expect(SPOT_SERVICES.find((service) => service.label === 'Sombra')?.icon).toBe('sun');
    });
});
