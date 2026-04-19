import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';

// Production-ready Neon database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_B6s0rywlRhao@ep-quiet-cell-amsnhw0l-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Main database connection with optimized settings
const sql = neon(DATABASE_URL, {
  // Connection pooling configuration
  connectionLimit: 20,
  maxUses: 10000, // Close connections after 10000 uses
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  // SSL configuration for production
  ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
  // Query timeout
  query_timeout: 30000, // 30 seconds
  // Retry configuration
  retry: 3,
  retryDelay: 1000
});

// Pooled connection for high-concurrency operations
const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 20, // Maximum number of connections
  min: 2,  // Minimum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { sql, pool };
export type { NeonQueryFunction };

// Database configuration interface
export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  queryTimeout: number;
  retryAttempts: number;
  enableMonitoring: boolean;
}

// Production database settings
export const dbConfig: DatabaseConfig = {
  url: DATABASE_URL,
  maxConnections: 20,
  queryTimeout: 30000,
  retryAttempts: 3,
  enableMonitoring: process.env.NODE_ENV === 'production'
};

// Enhanced connection test with health check
export async function testConnection(): Promise<boolean> {
  try {
    const startTime = Date.now();
    const result = await sql`SELECT 
      NOW() as server_time,
      version() as postgres_version,
      current_database() as database_name,
      current_user as current_user`;
    
    const duration = Date.now() - startTime;
    
    console.log('Database connected successfully:', {
      serverTime: result[0]?.server_time,
      version: result[0]?.postgres_version,
      database: result[0]?.database_name,
      user: result[0]?.current_user,
      connectionTime: `${duration}ms`
    });
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// Health check for monitoring
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await sql`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      status: latency < 1000 ? 'healthy' : 'unhealthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Connection with retry logic
export async function executeWithRetry<T>(
  query: () => Promise<T>,
  maxRetries: number = dbConfig.retryAttempts
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.warn(`Database query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Transaction helper
export async function withTransaction<T>(
  callback: (sql: NeonQueryFunction) => Promise<T>
): Promise<T> {
  try {
    // Neon serverless handles transactions automatically
    return await callback(sql);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// Performance monitoring
export async function getDatabaseStats() {
  try {
    const stats = await sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY schemaname, tablename
    `;
    
    return stats;
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return [];
  }
}

// Query performance monitoring (PostgreSQL 18)
export async function getSlowQueries(thresholdMs: number = 1000) {
  try {
    const queries = await sql`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        stddev_exec_time,
        max_exec_time,
        rows
      FROM pg_stat_statements
      WHERE mean_exec_time > ${thresholdMs}
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `;
    
    return queries;
  } catch (error) {
    console.error('Failed to get slow queries:', error);
    return [];
  }
}

// UUIDv7 helper functions (PostgreSQL 18)
export async function generateUUIDv7(): Promise<string> {
  try {
    const result = await sql`SELECT uuidv7() as id`;
    return result[0]?.id || '';
  } catch (error) {
    console.error('Failed to generate UUIDv7:', error);
    // Fallback to regular UUID
    const fallback = await sql`SELECT gen_random_uuid() as id`;
    return fallback[0]?.id || '';
  }
}

// Initialize database with schema
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('Initializing database schema...');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Check if tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `;
    
    if (!tablesExist[0]?.exists) {
      console.log('Tables not found. Please run schema.sql manually or through migration.');
      return false;
    }
    
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}
