import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
    }),
}));

import { signToken, verifyToken, hashPassword, verifyPassword } from './auth';

const ORIGINAL_SECRET = process.env.JWT_SECRET;

afterEach(() => {
    if (ORIGINAL_SECRET !== undefined) {
        process.env.JWT_SECRET = ORIGINAL_SECRET;
    } else {
        delete process.env.JWT_SECRET;
    }
});

// ── JWT_SECRET lazy validation ────────────────────────────────────────────────

describe('signToken - validación lazy de JWT_SECRET', () => {
    it('lanza error si JWT_SECRET no está definido', async () => {
        delete process.env.JWT_SECRET;
        await expect(signToken({ userId: 1 })).rejects.toThrow('JWT_SECRET environment variable is required');
    });

    it('genera un JWT válido cuando JWT_SECRET está definido', async () => {
        process.env.JWT_SECRET = 'test-secret-32-chars-long-enough!';
        const token = await signToken({ userId: 42, role: 'USER' });
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });
});

describe('verifyToken', () => {
    it('devuelve null si JWT_SECRET no está definido (error absorbido)', async () => {
        delete process.env.JWT_SECRET;
        const result = await verifyToken('any.token.here');
        expect(result).toBeNull();
    });

    it('devuelve null para un token inválido', async () => {
        process.env.JWT_SECRET = 'test-secret-32-chars-long-enough!';
        const result = await verifyToken('not.a.valid.jwt');
        expect(result).toBeNull();
    });

    it('devuelve el payload correcto para un token válido', async () => {
        process.env.JWT_SECRET = 'test-secret-32-chars-long-enough!';
        const token = await signToken({ userId: 99, role: 'ADMIN' });
        const payload = await verifyToken(token);
        expect(payload).not.toBeNull();
        expect(payload?.userId).toBe(99);
        expect(payload?.role).toBe('ADMIN');
    });

    it('devuelve null para un token firmado con otro secret', async () => {
        process.env.JWT_SECRET = 'secret-a-32-chars-long-enough!!!';
        const token = await signToken({ userId: 1 });

        process.env.JWT_SECRET = 'secret-b-32-chars-long-enough!!!';
        const result = await verifyToken(token);
        expect(result).toBeNull();
    });
});

// ── hashPassword / verifyPassword ─────────────────────────────────────────────

describe('hashPassword / verifyPassword', () => {
    it('verifica correctamente la contraseña original', async () => {
        const hash = await hashPassword('micontraseña');
        expect(await verifyPassword('micontraseña', hash)).toBe(true);
    });

    it('rechaza una contraseña incorrecta', async () => {
        const hash = await hashPassword('micontraseña');
        expect(await verifyPassword('otracontraseña', hash)).toBe(false);
    });

    it('genera hashes distintos para la misma contraseña (bcrypt salt)', async () => {
        const hash1 = await hashPassword('micontraseña');
        const hash2 = await hashPassword('micontraseña');
        expect(hash1).not.toBe(hash2);
    });
});
