// Basit bellek içi sayaç: başarısız giriş denemelerini sınırlar.
// Tek süreçte çalışır; sunucu yeniden başlayınca sıfırlanır.

interface Entry {
    count: number;
    resetAt: number;
}

const globalStore = globalThis as unknown as { __sbfRateLimit?: Map<string, Entry> };
const store = (globalStore.__sbfRateLimit ??= new Map<string, Entry>());

function current(key: string): Entry | undefined {
    const entry = store.get(key);
    if (entry && entry.resetAt <= Date.now()) {
        store.delete(key);
        return undefined;
    }
    return entry;
}

export function isRateLimited(key: string, limit: number): boolean {
    return (current(key)?.count ?? 0) >= limit;
}

export function registerFailure(key: string, windowMs: number): void {
    const entry = current(key);
    if (entry) {
        entry.count += 1;
    } else {
        store.set(key, { count: 1, resetAt: Date.now() + windowMs });
    }

    // Bellek şişmesin: süresi dolanları arada bir temizle
    if (store.size > 5000) {
        const now = Date.now();
        for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
    }
}

export function clearFailures(key: string): void {
    store.delete(key);
}
