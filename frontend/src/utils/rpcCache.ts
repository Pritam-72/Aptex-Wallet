/**
 * RPC Request Cache Utility
 * Prevents excessive RPC calls by caching responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RequestCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  
  /**
   * Get cached data or execute fetch function
   * @param key - Unique cache key
   * @param fetchFn - Function to fetch data if not cached
   * @param ttlMs - Time to live in milliseconds (default: 5000ms = 5 seconds)
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 5000
  ): Promise<T> {
    const now = Date.now();
    
    // Check if we have valid cached data
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      console.log(`🎯 Cache HIT for key: ${key.slice(0, 50)}...`);
      return cached.data as T;
    }
    
    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`⏳ Waiting for pending request: ${key.slice(0, 50)}...`);
      return pending as Promise<T>;
    }
    
    // Create new request
    console.log(`🔄 Cache MISS, fetching: ${key.slice(0, 50)}...`);
    const requestPromise = fetchFn().then(
      (data) => {
        // Store in cache
        this.cache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttlMs,
        });
        
        // Remove from pending
        this.pendingRequests.delete(key);
        
        return data;
      },
      (error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      }
    );
    
    // Store as pending
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }
  
  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Invalidated cache for key: ${key.slice(0, 50)}...`);
  }
  
  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Invalidated ${count} cache entries matching pattern: ${pattern}`);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.pendingRequests.clear();
    console.log(`🗑️ Cleared ${size} cache entries`);
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired cache entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(e => e.expiresAt > now).length,
      expiredEntries: entries.filter(e => e.expiresAt <= now).length,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Export singleton instance
export const rpcCache = new RequestCache();

// Auto cleanup expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    rpcCache.cleanup();
  }, 60000);
  
  // Make cache available in console for debugging
  (window as unknown as { rpcCache: RequestCache }).rpcCache = rpcCache;
  console.log('💾 RPC Cache initialized. Access via window.rpcCache');
}

/**
 * Generate cache key for contract view functions
 */
export const generateCacheKey = (
  functionName: string,
  ...args: (string | number | boolean | object)[]
): string => {
  return `${functionName}:${JSON.stringify(args)}`;
};
