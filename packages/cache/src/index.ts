/** Cache backend contract — swap `MemoryCache` for a Redis-backed (or other)
 * implementation later without touching call sites. Values are cached as-is
 * (no serialization step), so a networked implementation should handle
 * (de)serialization internally. */
export interface Cache {
  /** Returns the cached value for `key` if still fresh, otherwise calls
   * `fn`, caches the result for `ttlMs`, and returns it. Concurrent calls
   * during a miss will each trigger their own `fn` — callers needing
   * single-flight should await the first call before issuing more. */
  getOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T>;
  delete(key: string): void;
  clear(): void;
}

/** Default backend: a per-process `Map`. Not shared across
 * instances/processes — for that, implement `Cache` against Redis (or
 * similar) and swap it in at the call site. */
export class MemoryCache implements Cache {
  private readonly entries = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  async getOrSet<T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    const value = await fn();
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  delete(key: string) {
    this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }
}

/** Process-wide default cache instance — fine for values where a per-process
 * cache is acceptable (see `Cache` doc comment for when it isn't). */
export const cache: Cache = new MemoryCache();
