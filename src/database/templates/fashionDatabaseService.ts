/**
 * TEMPLATE: Fashion Database Service
 * Atomic Design Pattern - Complete page layout combining organisms, molecules, and atoms
 */

import { DatabaseConnection } from '../atoms/connection';
import { UserService } from '../organisms/userService';
import { defaultConnectionConfig } from '../atoms/connection';

// Template for complete fashion database service
export class FashionDatabaseService {
  private connection: DatabaseConnection;
  private userService: UserService;

  constructor(config = defaultConnectionConfig) {
    this.connection = new DatabaseConnection(config);
    this.userService = new UserService(this.connection);
  }

  // Template: Initialize service
  async initialize(): Promise<boolean> {
    try {
      // Test connection
      const connected = await this.connection.testConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }

      console.log('Fashion Database Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Fashion Database Service:', error);
      return false;
    }
  }

  // Template: Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: {
      database: any;
      userService: any;
    };
    timestamp: string;
  }> {
    const [databaseHealth, userHealth] = await Promise.all([
      this.connection.healthCheck(),
      this.userService.getUserAnalytics('health-check-user').catch(() => ({ status: 'error' }))
    ]);

    return {
      status: (databaseHealth.status === 'healthy' && userHealth.status !== 'error') ? 'healthy' : 'unhealthy',
      services: {
        database: databaseHealth,
        userService: userHealth
      },
      timestamp: new Date().toISOString()
    };
  }

  // Template: Complete user workflow
  async createUserWithProfile(userData: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    preferences?: any;
  }): Promise<{
    user: any;
    profile: any;
  }> {
    try {
      // Create user atom
      const user = await this.userService.create({
        clerkId: userData.clerkId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatar: userData.avatar
      });

      // Set preferences if provided
      if (userData.preferences) {
        await this.userService.updatePreferences(user.id, userData.preferences);
      }

      // Get complete profile
      const profile = await this.userService.getUserAnalytics(user.id);

      return {
        user,
        profile
      };
    } catch (error) {
      console.error('Failed to create user with profile:', error);
      throw error;
    }
  }

  // Template: Fashion search workflow
  async searchFashionItems(params: {
    query: string;
    userId?: string;
    filters?: {
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
    };
    limit?: number;
    offset?: number;
  }): Promise<{
    items: any[];
    total: number;
    hasMore: boolean;
    suggestions?: any[];
  }> {
    try {
      // Use query builder molecule
      const queryBuilder = this.connection.getSql();
      
      let baseQuery = queryBuilder`
        SELECT DISTINCT ON (id) id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
               similarity_score
        FROM (
                  SELECT id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
                         0.8 as similarity_score
                  FROM looks 
                  WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ to_tsquery('english', ${params.query})
                  AND isPublic = true
                  UNION ALL
                  SELECT id, userId, collectionId, title, description, imageUrl, tags, isPublic, createdAt, updatedAt,
                         0.6 as similarity_score
                  FROM looks 
                  WHERE to_tsvector('english', tags) @@ to_tsquery('english', ${params.query})
                  AND isPublic = true
               ) as search_results
      `;

      // Apply filters
      if (params.filters?.category) {
        baseQuery = queryBuilder`${baseQuery} WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(tags) as tag 
          WHERE tag ILIKE ${'%' + params.filters.category + '%'}
        )`;
      }

      if (params.filters?.brand) {
        baseQuery = queryBuilder`${baseQuery} AND title ILIKE ${'%' + params.filters.brand + '%'}`;
      }

      if (params.filters?.minPrice) {
        // This would require price data in the database
        baseQuery = queryBuilder`${baseQuery} AND (SELECT AVG(price) FROM item_prices WHERE look_id = looks.id) >= ${params.filters.minPrice}`;
      }

      if (params.filters?.maxPrice) {
        baseQuery = queryBuilder`${baseQuery} AND (SELECT AVG(price) FROM item_prices WHERE look_id = looks.id) <= ${params.filters.maxPrice}`;
      }

      // Add pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      baseQuery = queryBuilder`${baseQuery} ORDER BY similarity_score DESC, createdAt DESC LIMIT ${limit} OFFSET ${offset}`;

      const items = await baseQuery;
      
      // Get suggestions based on user preferences
      let suggestions = [];
      if (params.userId) {
        const userPrefs = await this.userService.getPreferences(params.userId);
        suggestions = await this.generateSuggestions(userPrefs, params.query);
      }

      return {
        items,
        total: items.length,
        hasMore: items.length === limit,
        suggestions
      };
    } catch (error) {
      console.error('Failed to search fashion items:', error);
      throw error;
    }
  }

  // Template: Generate suggestions
  private async generateSuggestions(userPreferences: any, query: string): Promise<any[]> {
    try {
      const queryBuilder = this.connection.getSql();
      
      // Suggest based on user's favorite brands
      if (userPreferences.favoriteBrands?.length > 0) {
        const brandSuggestions = await queryBuilder`
          SELECT DISTINCT brand, COUNT(*) as popularity
          FROM looks 
          WHERE brand = ANY(${userPreferences.favoriteBrands})
            AND isPublic = true
            AND createdAt >= NOW() - INTERVAL '30 days'
          GROUP BY brand
          ORDER BY popularity DESC
          LIMIT 5
        `;
        
        return brandSuggestions;
      }

      // Suggest based on preferred colors
      if (userPreferences.preferredColors?.length > 0) {
        const colorSuggestions = await queryBuilder`
          SELECT DISTINCT color, COUNT(*) as popularity
          FROM look_colors 
          WHERE color = ANY(${userPreferences.preferredColors})
            AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY color
          ORDER BY popularity DESC
          LIMIT 5
        `;
        
        return colorSuggestions;
      }

      return [];
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  // Template: Analytics workflow
  async getFashionAnalytics(timeframe = '30d'): Promise<{
    users: any;
    looks: any;
    collections: any;
    trends: any;
  }> {
    try {
      const queryBuilder = this.connection.getSql();
      
      const [userStats, lookStats, collectionStats, trendingData] = await Promise.all([
        queryBuilder`
          SELECT 
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE createdAt >= NOW() - INTERVAL '${timeframe}') as new_users,
            COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7d') as active_users
          FROM users
        `,
        queryBuilder`
          SELECT 
            COUNT(*) as total_looks,
            COUNT(*) FILTER (WHERE createdAt >= NOW() - INTERVAL '${timeframe}') as new_looks,
            COUNT(*) FILTER (WHERE isPublic = true) as public_looks,
            AVG(CASE WHEN isPublic THEN 1 ELSE 0 END) as public_ratio
          FROM looks
        `,
        queryBuilder`
          SELECT 
            COUNT(*) as total_collections,
            COUNT(*) FILTER (WHERE createdAt >= NOW() - INTERVAL '${timeframe}') as new_collections,
            AVG(itemsCount) as avg_items_per_collection
          FROM collections
        `,
        queryBuilder.getTrendingItems(timeframe, 20)
      ]);

      return {
        users: userStats[0] || {},
        looks: lookStats[0] || {},
        collections: collectionStats[0] || {},
        trends: trendingData
      };
    } catch (error) {
      console.error('Failed to get fashion analytics:', error);
      throw error;
    }
  }

  // Template: Cleanup and maintenance
  async cleanup(): Promise<{
    deletedUsers: number;
    deletedLooks: number;
    deletedCollections: number;
    optimizedTables: string[];
  }> {
    try {
      const queryBuilder = this.connection.getSql();
      
      const [userCleanup, lookCleanup, collectionCleanup, optimization] = await Promise.all([
        // Delete inactive users
        queryBuilder`
          DELETE FROM users 
          WHERE last_login < NOW() - INTERVAL '1 year' 
            AND id NOT IN (SELECT DISTINCT userId FROM looks WHERE createdAt >= NOW() - INTERVAL '30 days')
        `,
        // Delete old private looks
        queryBuilder`
          DELETE FROM looks 
          WHERE isPublic = false 
            AND createdAt < NOW() - INTERVAL '30 days'
        `,
        // Delete empty collections
        queryBuilder`
          DELETE FROM collections 
          WHERE itemsCount = 0 
            AND createdAt < NOW() - INTERVAL '6 months'
        `,
        // Optimize tables
        queryBuilder`
          SELECT 'ANALYZE ' || schemaname || '.' || tablename as command
          FROM pg_tables 
          WHERE schemaname = 'public'
            AND (n_live_tup + n_dead_tup) > 10000)
        `
      ]);

      // Execute optimization commands
      if (optimization.length > 0) {
        for (const opt of optimization) {
          await queryBuilder.sql(opt.command);
        }
      }

      return {
        deletedUsers: userCleanup.rowCount || 0,
        deletedLooks: lookCleanup.rowCount || 0,
        deletedCollections: collectionCleanup.rowCount || 0,
        optimizedTables: optimization.map(opt => opt.command)
      };
    } catch (error) {
      console.error('Failed to cleanup database:', error);
      throw error;
    }
  }

  // Template: Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      await this.connection.close();
      console.log('Fashion Database Service shut down gracefully');
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

// Export template for composition
export { FashionDatabaseService as DatabaseTemplate };
