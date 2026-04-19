import { createClient, RedisClientType } from 'redis';

// Redis client configuration
let redisClient: RedisClientType;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export class RedisService {
  /**
   * Initialize Redis connection
   */
  static async connect(): Promise<void> {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });

      redisClient.on('ready', () => {
        console.log('Redis Client Ready');
      });

      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Get Redis client
   */
  static getClient(): RedisClientType {
    if (!redisClient) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return redisClient;
  }

  /**
   * Set a value in cache with optional TTL
   */
  static async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      
      if (options?.ttl) {
        await client.setEx(key, options.ttl, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Failed to set cache value:', error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const value = await client.get(key);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Failed to get cache value:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  static async del(key: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.del(key);
    } catch (error) {
      console.error('Failed to delete cache value:', error);
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Failed to check cache existence:', error);
      return false;
    }
  }

  /**
   * Set cache with expiration
   */
  static async setWithExpire(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttlSeconds, serializedValue);
    } catch (error) {
      console.error('Failed to set cache with expiration:', error);
      throw error;
    }
  }

  /**
   * Increment a numeric value
   */
  static async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const client = this.getClient();
      return await client.incrBy(key, amount);
    } catch (error) {
      console.error('Failed to increment cache value:', error);
      throw error;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  static async getTTL(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('Failed to get TTL:', error);
      return -1;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  static async clear(): Promise<void> {
    try {
      const client = this.getClient();
      await client.flushDb();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  static async disconnect(): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.quit();
      }
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }
}

// Cache key generators
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userCollections: (userId: string) => `user:${userId}:collections`,
  userLooks: (userId: string) => `user:${userId}:looks`,
  collection: (collectionId: string) => `collection:${collectionId}`,
  look: (lookId: string) => `look:${lookId}`,
  aiGeneration: (generationId: string) => `ai:generation:${generationId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  rateLimit: (identifier: string) => `rate_limit:${identifier}`,
  searchResults: (query: string) => `search:${query}`,
  fashionRecommendations: (userId: string) => `recommendations:${userId}`,
};

export default RedisService;
