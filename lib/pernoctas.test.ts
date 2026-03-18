import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (initialized before vi.mock factories run) ─────────────────
const { mockGetSession, mockPrisma, mockReverseGeocode } = vi.hoisted(() => {
    const mockGetSession = vi.fn();
    const mockPrisma = {
        pernocta: {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
        }
    };
    const mockReverseGeocode = vi.fn();
    return { mockGetSession, mockPrisma, mockReverseGeocode };
});

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
}));
vi.mock('@/lib/auth', () => ({ getSession: () => mockGetSession() }));
vi.mock('./prisma', () => ({ default: mockPrisma }));
vi.mock('./geocode', () => ({ reverseGeocode: (...args: any[]) => mockReverseGeocode(...args) }));

// Import after mocks are registered
import { addPernocta, updatePernocta, deletePernocta, getPernoctas } from './actions';

// ── Datos base ───────────────────────────────────────────────────────────────

const SESSION = { userId: 1, role: 'USER' };

const BASE_PERNOCTA_DATA = {
    date: '2024-07-20',
    latitude: 40.416,
    longitude: -3.703,
    notes: 'Test note',
    weather: 'Soleado',
    cost: 5,
};

const GEO_RESULT = {
    locationName: 'Ciudad Real, España',
    province: 'Ciudad Real',
    country: 'España',
};

// ── Tests: addPernocta ───────────────────────────────────────────────────────

describe('addPernocta', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue(SESSION);
        mockReverseGeocode.mockResolvedValue(GEO_RESULT);
        mockPrisma.pernocta.create.mockResolvedValue({});
    });

    it('redirige a /login si no hay sesión activa', async () => {
        mockGetSession.mockResolvedValue(null);
        await expect(addPernocta(BASE_PERNOCTA_DATA)).rejects.toThrow('REDIRECT:/login');
    });

    it('llama a reverseGeocode con las coordenadas correctas', async () => {
        await addPernocta(BASE_PERNOCTA_DATA);
        expect(mockReverseGeocode).toHaveBeenCalledWith(40.416, -3.703);
    });

    it('crea la pernocta con los datos de geocodificación', async () => {
        await addPernocta(BASE_PERNOCTA_DATA);
        expect(mockPrisma.pernocta.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                locationName: 'Ciudad Real, España',
                province: 'Ciudad Real',
                country: 'España',
                userId: 1,
            }),
        });
    });

    it('guarda null en locationName si geocode falla', async () => {
        mockReverseGeocode.mockResolvedValue(null);
        await addPernocta(BASE_PERNOCTA_DATA);
        expect(mockPrisma.pernocta.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                locationName: null,
                province: null,
                country: null,
            }),
        });
    });

    it('usa 0 como coste por defecto si no se proporciona', async () => {
        const { cost: _cost, ...withoutCost } = BASE_PERNOCTA_DATA;
        await addPernocta(withoutCost);
        expect(mockPrisma.pernocta.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ cost: 0 }),
        });
    });

    it('convierte la fecha string a objeto Date', async () => {
        await addPernocta(BASE_PERNOCTA_DATA);
        expect(mockPrisma.pernocta.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                date: new Date('2024-07-20'),
            }),
        });
    });
});

// ── Tests: updatePernocta ────────────────────────────────────────────────────

describe('updatePernocta', () => {
    const EXISTING_PERNOCTA = {
        id: 10,
        userId: 1,
        date: new Date('2024-07-20'),
        latitude: 40.416,
        longitude: -3.703,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue(SESSION);
        mockReverseGeocode.mockResolvedValue(GEO_RESULT);
        mockPrisma.pernocta.findUnique.mockResolvedValue(EXISTING_PERNOCTA);
        mockPrisma.pernocta.update.mockResolvedValue({});
    });

    it('redirige a /login si no hay sesión activa', async () => {
        mockGetSession.mockResolvedValue(null);
        await expect(updatePernocta(10, BASE_PERNOCTA_DATA)).rejects.toThrow('REDIRECT:/login');
    });

    it('no actualiza si la pernocta no existe', async () => {
        mockPrisma.pernocta.findUnique.mockResolvedValue(null);
        await updatePernocta(999, BASE_PERNOCTA_DATA);
        expect(mockPrisma.pernocta.update).not.toHaveBeenCalled();
    });

    it('no actualiza si la pernocta pertenece a otro usuario', async () => {
        mockPrisma.pernocta.findUnique.mockResolvedValue({ ...EXISTING_PERNOCTA, userId: 99 });
        await updatePernocta(10, BASE_PERNOCTA_DATA);
        expect(mockPrisma.pernocta.update).not.toHaveBeenCalled();
    });

    it('actualiza los datos de la pernocta con nueva geocodificación', async () => {
        await updatePernocta(10, BASE_PERNOCTA_DATA);
        expect(mockPrisma.pernocta.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: expect.objectContaining({
                locationName: 'Ciudad Real, España',
                province: 'Ciudad Real',
                country: 'España',
            }),
        });
    });
});

// ── Tests: deletePernocta ────────────────────────────────────────────────────

describe('deletePernocta', () => {
    const EXISTING_PERNOCTA = { id: 10, userId: 1 };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue(SESSION);
        mockPrisma.pernocta.findUnique.mockResolvedValue(EXISTING_PERNOCTA);
        mockPrisma.pernocta.delete.mockResolvedValue({});
    });

    it('redirige a /login si no hay sesión activa', async () => {
        mockGetSession.mockResolvedValue(null);
        await expect(deletePernocta(10)).rejects.toThrow('REDIRECT:/login');
    });

    it('no borra si la pernocta no existe', async () => {
        mockPrisma.pernocta.findUnique.mockResolvedValue(null);
        await deletePernocta(999);
        expect(mockPrisma.pernocta.delete).not.toHaveBeenCalled();
    });

    it('no borra si la pernocta pertenece a otro usuario', async () => {
        mockPrisma.pernocta.findUnique.mockResolvedValue({ id: 10, userId: 99 });
        await deletePernocta(10);
        expect(mockPrisma.pernocta.delete).not.toHaveBeenCalled();
    });

    it('borra la pernocta del usuario correcto', async () => {
        await deletePernocta(10);
        expect(mockPrisma.pernocta.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
});

// ── Tests: getPernoctas ──────────────────────────────────────────────────────

describe('getPernoctas', () => {
    const RAW_PERNOCTAS = [
        {
            id: 1,
            userId: 1,
            date: new Date('2024-07-20T10:00:00Z'),
            createdAt: new Date('2024-07-21T10:00:00Z'),
            latitude: 40.416,
            longitude: -3.703,
            notes: null,
            weather: null,
            cost: 0,
            locationName: 'Madrid',
            province: 'Madrid',
            country: 'España',
            spotId: null,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue(SESSION);
        mockPrisma.pernocta.findMany.mockResolvedValue(RAW_PERNOCTAS);
    });

    it('devuelve [] si no hay sesión activa', async () => {
        mockGetSession.mockResolvedValue(null);
        const result = await getPernoctas();
        expect(result).toEqual([]);
    });

    it('consulta solo las pernoctas del usuario de sesión', async () => {
        await getPernoctas();
        expect(mockPrisma.pernocta.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: 1 } })
        );
    });

    it('ordena las pernoctas por fecha descendente', async () => {
        await getPernoctas();
        expect(mockPrisma.pernocta.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { date: 'desc' } })
        );
    });

    it('convierte date y createdAt a ISO strings', async () => {
        const result = await getPernoctas();
        expect(typeof result[0].date).toBe('string');
        expect(typeof result[0].createdAt).toBe('string');
        expect(result[0].date).toBe('2024-07-20T10:00:00.000Z');
    });
});
