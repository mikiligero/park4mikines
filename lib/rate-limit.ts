const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
    ip: string,
    action: string,
    { limit, windowSecs }: { limit: number; windowSecs: number }
): { success: boolean } {
    const key = `${action}:${ip}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
        return { success: true };
    }

    if (entry.count >= limit) {
        return { success: false };
    }

    entry.count++;
    return { success: true };
}
