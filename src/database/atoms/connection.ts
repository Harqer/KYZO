/**
 * ATOM: Basic Database Connection
 * Atomic Design Pattern - Smallest reusable unit
 */

import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';

// Connection configuration atom
export interface ConnectionConfig {
  url: string;
  maxConnections: number;
  queryTimeout: number;
  retryAttempts: number;
  enableMonitoring: boolean;
}

// Connection health atom
export interface ConnectionHealth {
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
  timestamp: string;
}

// Basic connection atom
export class DatabaseConnection {
  private sql: NeonQueryFunction;
  private pool: Pool;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.sql = neon(config.url, {
      connectionLimit: config.maxConnections,
      maxUses: 10000,
      idleTimeoutMillis: 30000,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      query_timeout: config.queryTimeout,
      retry: config.retryAttempts,
      retryDelay: 1000
    });

    this.pool = new Pool({
      connectionString: config.url,
      max: config.maxConnections,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Atom: Basic connection test
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.sql`SELECT 
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

  // Atom: Health check
  async healthCheck(): Promise<ConnectionHealth> {
    const startTime = Date.now();
  
    try {
      await this.sql`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        status: latency < 1000 ? 'healthy' : 'unhealthy',
        latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Atom: Get SQL instance
  getSql(): NeonQueryFunction {
    return this.sql;
  }

  // Atom: Get pool instance
  getPool(): Pool {
    return this.pool;
  }

  // Atom: Get config
  getConfig(): ConnectionConfig {
    return this.config;
  }

  // Atom: Graceful shutdown
  async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('Database connections closed gracefully');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

// Default configuration atom
export const defaultConnectionConfig: ConnectionConfig = {
  url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_B6s0rywlRhao@ep-quiet-cell-amsnhw0l-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  maxConnections: 20,
  queryTimeout: 30000,
  retryAttempts: 3,
  enableMonitoring: process.env.NODE_ENV === 'production'
};

// Export atoms for composition
export { DatabaseConnection as ConnectionAtom, ConnectionHealth as HealthAtom };
