/**
 * MOLECULE: Query Builder
 * Atomic Design Pattern - Combination of atoms for database queries
 */

import { DatabaseConnection, ConnectionHealth } from '../atoms/connection';

// Query builder molecule
export class QueryBuilder {
  private connection: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.connection = connection;
  }

  // Molecule: User queries
  async findUserById(id: string) {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT id, clerkId, email, firstName, lastName, avatar, createdAt, updatedAt
        FROM users 
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Failed to find user by ID:', error);
      throw error;
    }
  }

  async findUserByClerkId(clerkId: string) {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT id, clerkId, email, firstName, lastName, avatar, createdAt, updatedAt
        FROM users 
        WHERE clerkId = ${clerkId}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Failed to find user by Clerk ID:', error);
      throw error;
    }
  }

  // Molecule: Collection queries
  async findCollectionsByUserId(userId: string, limit = 20, offset = 0) {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT id, userId, name, description, image, itemsCount, isPublic, createdAt, updatedAt
        FROM collections 
        WHERE userId = ${userId}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return result;
    } catch (error) {
      console.error('Failed to find collections by user ID:', error);
      throw error;
    }
  }

  // Molecule: Look queries
  async findLooksByUserId(userId: string, collectionId?: string, limit = 20, offset = 0) {
    try {
      const sql = this.connection.getSql();
      let query = sql`
        SELECT id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt
        FROM looks 
        WHERE userId = ${userId}
      `;

      if (collectionId) {
        query = sql`${query} AND collectionId = ${collectionId}`;
      }

      query = sql`${query} ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Failed to find looks by user ID:', error);
      throw error;
    }
  }

  // Molecule: Model queries
  async findModelsByUserId(userId: string, limit = 20, offset = 0) {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT id, userId, name, imageUrl, isActive, createdAt, updatedAt
        FROM models 
        WHERE userId = ${userId}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return result;
    } catch (error) {
      console.error('Failed to find models by user ID:', error);
      throw error;
    }
  }

  // Molecule: Search queries
  async searchFashionItems(query: string, userId?: string, filters?: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    try {
      const sql = this.connection.getSql();
      
      let baseQuery = sql`
        SELECT DISTINCT ON (id) id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
               similarity_score
        FROM (
                  SELECT id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
                         0.8 as similarity_score
                  FROM looks 
                  WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ to_tsquery('english', ${query})
                  AND isPublic = true
                  UNION ALL
                  SELECT id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
                         0.6 as similarity_score
                  FROM looks 
                  WHERE to_tsvector('english', tags) @@ to_tsquery('english', ${query})
                  AND isPublic = true
               ) as search_results
      `;

      // Apply filters
      if (filters?.category) {
        baseQuery = sql`${baseQuery} WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(tags) as tag 
          WHERE tag ILIKE ${'%' + filters.category + '%'}
        )`;
      }

      if (filters?.brand) {
        baseQuery = sql`${baseQuery} AND title ILIKE ${'%' + filters.brand + '%'}`;
      }

      baseQuery = sql`${baseQuery} ORDER BY similarity_score DESC, createdAt DESC LIMIT 50`;

      const result = await baseQuery;
      return result;
    } catch (error) {
      console.error('Failed to search fashion items:', error);
      throw error;
    }
  }

  // Molecule: Analytics queries
  async getUserStats(userId: string) {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT 
          (SELECT COUNT(*) FROM collections WHERE userId = ${userId}) as total_collections,
          (SELECT COUNT(*) FROM looks WHERE userId = ${userId}) as total_looks,
          (SELECT COUNT(*) FROM models WHERE userId = ${userId}) as total_models,
          (SELECT COUNT(*) FROM looks WHERE userId = ${userId} AND isPublic = true) as public_looks,
          (SELECT AVG(itemsCount) FROM collections WHERE userId = ${userId}) as avg_items_per_collection
      `;
      
      return result[0] || {
        total_collections: 0,
        total_looks: 0,
        total_models: 0,
        public_looks: 0,
        avg_items_per_collection: 0
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  }

  // Molecule: Trending queries
  async getTrendingItems(timeframe = '7d', limit = 20) {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT 
          id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
          COUNT(*) OVER (PARTITION BY userId) as user_look_count,
          AVG(CASE WHEN isPublic THEN 1 ELSE 0 END) OVER (PARTITION BY userId) as user_public_ratio
        FROM looks 
        WHERE createdAt >= NOW() - INTERVAL '${timeframe}'
          AND isPublic = true
        ORDER BY 
          user_public_ratio DESC,
          user_look_count DESC,
          createdAt DESC
        LIMIT ${limit}
      `;
      
      return result;
    } catch (error) {
      console.error('Failed to get trending items:', error);
      throw error;
    }
  }

  // Molecule: Health check
  async getDatabaseHealth(): Promise<ConnectionHealth[]> {
    try {
      const sql = this.connection.getSql();
      
      const [connectionHealth, tableStats, slowQueries] = await Promise.all([
        this.connection.healthCheck(),
        sql`
          SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
          ORDER BY schemaname, tablename
        `,
        sql`
          SELECT 
            query,
            calls,
            total_exec_time,
            mean_exec_time,
            stddev_exec_time,
            max_exec_time,
            rows
          FROM pg_stat_statements
          WHERE mean_exec_time > 1000
          ORDER BY mean_exec_time DESC
          LIMIT 10
        `
      ]);

      return [connectionHealth, tableStats, slowQueries];
    } catch (error) {
      console.error('Failed to get database health:', error);
      throw error;
    }
  }

  // Molecule: Transaction helper
  async withTransaction<T>(callback: (sql: any) => Promise<T>): Promise<T> {
    try {
      const sql = this.connection.getSql();
      return await callback(sql);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
}

// Export molecule for composition
export { QueryBuilder as DatabaseQueryBuilder };
