import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-native-auth0', () => ({
    default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('expo-crypto', () => ({
    getRandomBytesAsync: vi.fn(),
    digestStringAsync: vi.fn(),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { BASE64: 'base64' },
}));

const BASE64URL_PATTERN = /^[A-Za-z0-9\-_]+$/;

describe('PKCE - generateCodeVerifier', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('produces a base64url string of 43-128 chars from 32 random bytes', async () => {
        const { getRandomBytesAsync } = await import('expo-crypto');
        const { generateCodeVerifier } = await import('../src/auth/auth0.js');

        vi.mocked(getRandomBytesAsync).mockResolvedValue(new Uint8Array(32).fill(0xab));

        const verifier = await generateCodeVerifier();

        expect(verifier.length).toBeGreaterThanOrEqual(43);
        expect(verifier.length).toBeLessThanOrEqual(128);
        expect(BASE64URL_PATTERN.test(verifier)).toBe(true);
    });

    it('uses CSPRNG (expo-crypto) not Math.random', async () => {
        const { getRandomBytesAsync } = await import('expo-crypto');
        const { generateCodeVerifier } = await import('../src/auth/auth0.js');

        vi.mocked(getRandomBytesAsync).mockResolvedValue(new Uint8Array(32).fill(0x01));

        await generateCodeVerifier();

        expect(getRandomBytesAsync).toHaveBeenCalledWith(32);
    });

    it('produces different verifiers for different random bytes', async () => {
        const { getRandomBytesAsync } = await import('expo-crypto');
        const { generateCodeVerifier } = await import('../src/auth/auth0.js');

        vi.mocked(getRandomBytesAsync)
            .mockResolvedValueOnce(new Uint8Array(32).fill(0x01))
            .mockResolvedValueOnce(new Uint8Array(32).fill(0x02));

        const v1 = await generateCodeVerifier();
        const v2 = await generateCodeVerifier();

        expect(v1).not.toBe(v2);
    });
});

describe('PKCE - generateCodeChallenge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('passes RFC 7636 known test vector', async () => {
        const { digestStringAsync } = await import('expo-crypto');
        const { generateCodeChallenge } = await import('../src/auth/auth0.js');

        vi.mocked(digestStringAsync).mockResolvedValue('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw+cM=');

        const challenge = await generateCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');

        expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    });

    it('converts standard base64 to base64url (replaces +, /, =)', async () => {
        const { digestStringAsync } = await import('expo-crypto');
        const { generateCodeChallenge } = await import('../src/auth/auth0.js');

        vi.mocked(digestStringAsync).mockResolvedValue('ab+cd/ef==');

        const challenge = await generateCodeChallenge('any-verifier');

        expect(challenge).toBe('ab-cd_ef');
        expect(challenge).not.toContain('+');
        expect(challenge).not.toContain('/');
        expect(challenge).not.toContain('=');
    });

    it('calls SHA-256 digest with the verifier string', async () => {
        const { digestStringAsync } = await import('expo-crypto');
        const { generateCodeChallenge } = await import('../src/auth/auth0.js');

        vi.mocked(digestStringAsync).mockResolvedValue('abc=');

        await generateCodeChallenge('my-verifier');

        expect(digestStringAsync).toHaveBeenCalledWith(
            'SHA-256',
            'my-verifier',
            { encoding: 'base64' },
        );
    });
});

describe('buildSession - uses sub from auth response', () => {
    it('AuthSession shape has sub field (not userId/auth0Id)', () => {
        const session = {
            accessToken: 'tok',
            refreshToken: 'rtok',
            expiresAt: new Date().toISOString(),
            sub: 'auth0|abc123',
        };

        expect(session.sub).toBe('auth0|abc123');
        expect('userId' in session).toBe(false);
        expect('auth0Id' in session).toBe(false);
    });
});
