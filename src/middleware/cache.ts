import { Request, Response, NextFunction } from 'express';
import { RedisService, CacheKeys } from '../config/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

interface CachedResponse {
  status: number;
  headers: Record<string, string>;
  data: any;
}

/**
 * Middleware to cache GET requests
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = (req) => req.method === 'GET',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache if condition is met
    if (!condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached response
      const cachedResponse = await RedisService.get<CachedResponse>(cacheKey);
      
      if (cachedResponse) {
        // Return cached response
        res.set(cachedResponse.headers);
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }

      // Intercept response to cache it
      const originalJson = res.json;
      const originalStatus = res.status;
      let responseData: any;
      let statusCode: number;
      let responseHeaders: any = {};

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      res.set = function(field: string | any, val?: string) {
        if (typeof field === 'string') {
          responseHeaders[field] = val;
        } else {
          responseHeaders = { ...responseHeaders, ...field };
        }
        return this;
      };

      res.json = function(data: any) {
        responseData = data;
        
        // Cache the response
        const cacheData = {
          status: statusCode || 200,
          headers: responseHeaders,
          data: responseData,
        };

        RedisService.set(cacheKey, cacheData, { ttl }).catch((error) => {
          console.error('Failed to cache response:', error);
        });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching if Redis fails
    }
  };
};

/**
 * Middleware to invalidate cache on POST/PUT/DELETE requests
 */
export const invalidateCacheMiddleware = (keys: string[] | ((req: Request) => string[])) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Invalidate cache after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const keysToInvalidate = typeof keys === 'function' ? keys(req) : keys;
        
        Promise.all(
          keysToInvalidate.map(key => RedisService.del(key).catch(console.error))
        ).catch((error) => {
          console.error('Failed to invalidate cache:', error);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Rate limiting middleware using Redis
 */
export const rateLimitMiddleware = (options: {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
}) => {
  const { windowMs, maxRequests, keyGenerator = (req) => req.ip || 'unknown' } = options;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = CacheKeys.rateLimit(keyGenerator(req));
    
    try {
      const currentRequests = await RedisService.increment(key);
      
      if (currentRequests === 1) {
        // Set expiration for the first request in the window
        await RedisService.setWithExpire(key, 1, Math.ceil(windowMs / 1000));
      }
      
      if (currentRequests > maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          data: {
            limit: maxRequests,
            windowMs,
            retryAfter: await RedisService.getTTL(key),
          },
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue without rate limiting if Redis fails
    }
  };
};

/**
 * User-specific caching middleware
 */
export const userCacheMiddleware = (options: CacheOptions = {}) => {
  const { ttl = 600 } = options; // 10 minutes default for user data
  
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      return `${req.method}:${req.originalUrl}:user:${userId}`;
    },
    condition: (req) => req.method === 'GET' && !!req.user?.id,
  });
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  // User-related cache invalidation
  invalidateUser: (userId: string) => [
    CacheKeys.user(userId),
    CacheKeys.userCollections(userId),
    CacheKeys.userLooks(userId),
    CacheKeys.fashionRecommendations(userId),
  ],
  
  // Collection-related cache invalidation
  invalidateCollection: (collectionId: string, userId?: string) => {
    const keys = [CacheKeys.collection(collectionId)];
    if (userId) {
      keys.push(...CacheInvalidation.invalidateUser(userId));
    }
    return keys;
  },
  
  // Look-related cache invalidation
  invalidateLook: (lookId: string, userId?: string) => {
    const keys = [CacheKeys.look(lookId)];
    if (userId) {
      keys.push(...CacheInvalidation.invalidateUser(userId));
    }
    return keys;
  },
  
  // Search cache invalidation
  invalidateSearch: (query: string) => [CacheKeys.searchResults(query)],
};
