import { sql, healthCheck, getDatabaseStats, getSlowQueries } from '../config/database';

export interface DatabaseMetrics {
  timestamp: Date;
  health: {
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  };
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  performance: {
    slowQueries: number;
    avgQueryTime: number;
    totalQueries: number;
  };
  storage: {
    databaseSize: string;
    tableSizes: Array<{
      table: string;
      size: string;
      rows: number;
    }>;
  };
  indexes: {
    totalIndexes: number;
    unusedIndexes: Array<{
      index: string;
      table: string;
      size: string;
    }>;
  };
  // PostgreSQL 18 specific metrics
  ioMetrics?: Array<{
    object: string;
    ioContext: string;
    totalReads: number;
    totalWrites: number;
    totalReadBytes: number;
    totalWriteBytes: number;
    avgReadTime: number;
    avgWriteTime: number;
  }>;
  backendIOActivity?: Array<{
    pid: number;
    username: string;
    appName: string;
    clientAddr: string;
    state: string;
    readBytes: number;
    writeBytes: number;
    queryDuration: number;
  }>;
  oauthActivity?: Array<{
    provider: string;
    subjectId: string;
    lastVerified: Date;
    sessionCount: number;
    lastActivity: Date;
  }>;
}

export class DatabaseMonitor {
  private metrics: DatabaseMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private readonly intervalMs: number = 60000) { // 1 minute default
  }

  async collectMetrics(): Promise<DatabaseMetrics> {
    const timestamp = new Date();

    try {
      // Health check
      const health = await healthCheck();

      // Connection metrics
      const connections = await this.getConnectionMetrics();

      // Performance metrics
      const performance = await this.getPerformanceMetrics();

      // Storage metrics
      const storage = await this.getStorageMetrics();

      // Index metrics
      const indexes = await this.getIndexMetrics();

      // I/O metrics
      const ioMetrics = await this.getIOMetrics();

      // Backend I/O activity
      const backendIOActivity = await this.getBackendIOActivity();

      // OAuth activity
      const oauthActivity = await this.getOAuthActivity();

      const metrics: DatabaseMetrics = {
        timestamp,
        health,
        connections,
        performance,
        storage,
        indexes,
        ioMetrics,
        backendIOActivity,
        oauthActivity
      };

      // Store metrics (keep last 100 entries)
      this.metrics.push(metrics);
      if (this.metrics.length > 100) {
        this.metrics.shift();
      }

      return metrics;
    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      
      // Return degraded metrics
      return {
        timestamp,
        health: {
          status: 'unhealthy',
          latency: -1,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        connections: { active: 0, idle: 0, total: 0 },
        performance: { slowQueries: 0, avgQueryTime: 0, totalQueries: 0 },
        storage: { databaseSize: '0 MB', tableSizes: [] },
        indexes: { totalIndexes: 0, unusedIndexes: [] }
      };
    }
  }

  private async getConnectionMetrics(): Promise<DatabaseMetrics['connections']> {
    try {
      const result = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle,
          COUNT(*) as total
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const row = result[0];
      return {
        active: parseInt(row.active) || 0,
        idle: parseInt(row.idle) || 0,
        total: parseInt(row.total) || 0
      };
    } catch (error) {
      console.error('Failed to get connection metrics:', error);
      return { active: 0, idle: 0, total: 0 };
    }
  }

  private async getPerformanceMetrics(): Promise<DatabaseMetrics['performance']> {
    try {
      const slowQueries = await getSlowQueries(500); // Queries slower than 500ms
      const stats = await sql`
        SELECT 
          SUM(calls) as total_queries,
          AVG(mean_exec_time) as avg_time
        FROM pg_stat_statements
      `;

      const row = stats[0];
      return {
        slowQueries: slowQueries.length,
        avgQueryTime: parseFloat(row.avg_time) || 0,
        totalQueries: parseInt(row.total_queries) || 0
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { slowQueries: 0, avgQueryTime: 0, totalQueries: 0 };
    }
  }

  private async getStorageMetrics(): Promise<DatabaseMetrics['storage']> {
    try {
      // Database size
      const dbSizeResult = await sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

      // Table sizes
      const tableSizes = await sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_live_tup as rows
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      return {
        databaseSize: dbSizeResult[0]?.size || '0 MB',
        tableSizes: tableSizes.map(row => ({
          table: `${row.schemaname}.${row.tablename}`,
          size: row.size,
          rows: parseInt(row.rows) || 0
        }))
      };
    } catch (error) {
      console.error('Failed to get storage metrics:', error);
      return { databaseSize: '0 MB', tableSizes: [] };
    }
  }

  private async getIndexMetrics(): Promise<DatabaseMetrics['indexes']> {
    try {
      // Total indexes
      const totalResult = await sql`
        SELECT COUNT(*) as count
        FROM pg_indexes
        WHERE schemaname = 'public'
      `;

      // Unused indexes
      const unusedResult = await sql`
        SELECT 
          schemaname||'.'||indexname as index_name,
          schemaname||'.'||tablename as table_name,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        AND schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
      `;

      return {
        totalIndexes: parseInt(totalResult[0]?.count) || 0,
        unusedIndexes: unusedResult.map(row => ({
          index: row.index_name,
          table: row.table_name,
          size: row.size
        }))
      };
    } catch (error) {
      console.error('Failed to get index metrics:', error);
      return { totalIndexes: 0, unusedIndexes: [] };
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Database monitoring is already running');
      return;
    }

    console.log(`Starting database monitoring (interval: ${this.intervalMs}ms)`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        
        // Log critical issues
        if (metrics.health.status === 'unhealthy') {
          console.error('Database health check failed:', metrics.health.error);
        }

        if (metrics.performance.slowQueries > 5) {
          console.warn(`High number of slow queries: ${metrics.performance.slowQueries}`);
        }

        if (metrics.connections.total > 150) {
          console.warn(`High connection count: ${metrics.connections.total}`);
        }

        // Store metrics for dashboard
        this.emitMetrics(metrics);
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, this.intervalMs);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('Database monitoring is not running');
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    console.log('Database monitoring stopped');
  }

  private emitMetrics(metrics: DatabaseMetrics): void {
    // In production, this would send to monitoring systems
    // For now, we'll just log key metrics periodically
    if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
      console.log('Database Metrics:', {
        health: metrics.health.status,
        connections: metrics.connections.total,
        slowQueries: metrics.performance.slowQueries,
        avgQueryTime: `${metrics.performance.avgQueryTime.toFixed(2)}ms`,
        databaseSize: metrics.storage.databaseSize
      });
    }
  }

  getLatestMetrics(): DatabaseMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(hours: number = 1): DatabaseMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  async generateReport(): Promise<{
    summary: string;
    recommendations: string[];
    alerts: string[];
  }> {
    const latest = this.getLatestMetrics();
    if (!latest) {
      return {
        summary: 'No metrics available',
        recommendations: [],
        alerts: []
      };
    }

    const alerts: string[] = [];
    const recommendations: string[] = [];

    // Health alerts
    if (latest.health.status === 'unhealthy') {
      alerts.push(`Database unhealthy: ${latest.health.error}`);
    } else if (latest.health.latency > 500) {
      alerts.push(`High latency: ${latest.health.latency}ms`);
    }

    // Connection alerts
    if (latest.connections.total > 150) {
      alerts.push(`High connection count: ${latest.connections.total}`);
    } else if (latest.connections.active > 100) {
      recommendations.push('Consider increasing connection pool size');
    }

    // Performance alerts
    if (latest.performance.slowQueries > 10) {
      alerts.push(`Many slow queries: ${latest.performance.slowQueries}`);
    } else if (latest.performance.slowQueries > 3) {
      recommendations.push('Review and optimize slow queries');
    }

    if (latest.performance.avgQueryTime > 100) {
      recommendations.push('Average query time is high, consider optimization');
    }

    // Storage alerts
    const dbSizeMB = this.parseSizeToMB(latest.storage.databaseSize);
    if (dbSizeMB > 10000) { // 10GB
      alerts.push(`Large database size: ${latest.storage.databaseSize}`);
    }

    // Index recommendations
    if (latest.indexes.unusedIndexes.length > 5) {
      recommendations.push('Consider removing unused indexes to save space');
    }

    const summary = `
Database Status: ${latest.health.status}
Connections: ${latest.connections.active} active / ${latest.connections.total} total
Query Performance: ${latest.performance.avgQueryTime.toFixed(2)}ms avg, ${latest.performance.slowQueries} slow queries
Database Size: ${latest.storage.databaseSize}
Indexes: ${latest.indexes.totalIndexes} total, ${latest.indexes.unusedIndexes.length} unused
    `.trim();

    return { summary, recommendations, alerts };
  }

  // PostgreSQL 18 specific monitoring methods
  private async getIOMetrics() {
    try {
      const metrics = await sql`
        SELECT 
          object,
          io_context,
          SUM(reads) as total_reads,
          SUM(writes) as total_writes,
          SUM(read_bytes) as total_read_bytes,
          SUM(write_bytes) as total_write_bytes,
          SUM(extends) as total_extends,
          SUM(extend_bytes) as total_extend_bytes,
          SUM(fsyncs) as total_fsyncs,
          AVG(read_time) as avg_read_time,
          AVG(write_time) as avg_write_time
        FROM pg_stat_io
        GROUP BY object, io_context
        ORDER BY total_read_bytes DESC, total_write_bytes DESC
      `;
      
      return metrics.map(row => ({
        object: row.object,
        ioContext: row.io_context,
        totalReads: parseInt(row.total_reads) || 0,
        totalWrites: parseInt(row.total_writes) || 0,
        totalReadBytes: parseInt(row.total_read_bytes) || 0,
        totalWriteBytes: parseInt(row.total_write_bytes) || 0,
        avgReadTime: parseFloat(row.avg_read_time) || 0,
        avgWriteTime: parseFloat(row.avg_write_time) || 0
      }));
    } catch (error) {
      console.error('Failed to get I/O metrics:', error);
      return [];
    }
  }

  private async getBackendIOActivity() {
    try {
      const activity = await sql`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query_start,
          -- Backend I/O stats
          backend_io.read_bytes,
          backend_io.write_bytes,
          backend_io.reads,
          backend_io.writes,
          -- Performance indicators
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start)) as query_duration_seconds
        FROM pg_stat_activity a
        LEFT JOIN pg_stat_get_backend_io(a.pid) backend_io ON true
        WHERE a.state != 'idle'
        ORDER BY query_start
      `;
      
      return activity.map(row => ({
        pid: parseInt(row.pid) || 0,
        username: row.usename,
        appName: row.application_name,
        clientAddr: row.client_addr,
        state: row.state,
        readBytes: parseInt(row.read_bytes) || 0,
        writeBytes: parseInt(row.write_bytes) || 0,
        queryDuration: parseFloat(row.query_duration_seconds) || 0
      }));
    } catch (error) {
      console.error('Failed to get backend I/O activity:', error);
      return [];
    }
  }

  private async getOAuthActivity() {
    try {
      const activity = await sql`
        SELECT 
          u.oauth_provider,
          u.oauth_subject_id,
          u.oauth_last_verified,
          COUNT(*) as session_count,
          MAX(ua.created_at) as last_activity,
          COUNT(DISTINCT ua.ip_address) as unique_ips
        FROM users u
        LEFT JOIN user_activities ua ON u.id = ua.user_id
        WHERE u.oauth_provider IS NOT NULL
        GROUP BY u.oauth_provider, u.oauth_subject_id, u.oauth_last_verified
        ORDER BY last_activity DESC
      `;
      
      return activity.map(row => ({
        provider: row.oauth_provider,
        subjectId: row.oauth_subject_id,
        lastVerified: row.oauth_last_verified,
        sessionCount: parseInt(row.session_count) || 0,
        lastActivity: row.last_activity
      }));
    } catch (error) {
      console.error('Failed to get OAuth activity:', error);
      return [];
    }
  }

  private parseSizeToMB(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(MB|GB|TB|kB)/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case 'KB': return value / 1024;
      case 'MB': return value;
      case 'GB': return value * 1024;
      case 'TB': return value * 1024 * 1024;
      default: return 0;
    }
  }
}

// Export singleton instance
export const databaseMonitor = new DatabaseMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  databaseMonitor.startMonitoring();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  databaseMonitor.stopMonitoring();
});

process.on('SIGINT', () => {
  databaseMonitor.stopMonitoring();
});
