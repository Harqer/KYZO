/**
 * ORGANISM: User Service
 * Atomic Design Pattern - Complex UI section combining molecules and atoms
 */

import { DatabaseConnection } from '../atoms/connection';
import { QueryBuilder } from '../molecules/queryBuilder';
import { User } from '../../types';

// User service organism
export class UserService {
  private connection: DatabaseConnection;
  private queryBuilder: QueryBuilder;

  constructor(connection: DatabaseConnection) {
    this.connection = connection;
    this.queryBuilder = new QueryBuilder(connection);
  }

  // Organism: Complete user management
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        INSERT INTO users (clerkId, email, firstName, lastName, avatar, createdAt, updatedAt)
        VALUES (${userData.clerkId}, ${userData.email}, ${userData.firstName}, ${userData.lastName}, ${userData.avatar}, NOW(), NOW())
        RETURNING id, clerkId, email, firstName, lastName, avatar, createdAt, updatedAt
      `;
      
      return result[0];
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        UPDATE users 
        SET 
          clerkId = COALESCE(${userData.clerkId}, clerkId),
          email = COALESCE(${userData.email}, email),
          firstName = COALESCE(${userData.firstName}, firstName),
          lastName = COALESCE(${userData.lastName}, lastName),
          avatar = COALESCE(${userData.avatar}, avatar),
          updatedAt = NOW()
        WHERE id = ${id}
        RETURNING id, clerkId, email, firstName, lastName, avatar, createdAt, updatedAt
      `;
      
      return result[0] || null;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    return await this.queryBuilder.findUserById(id);
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return await this.queryBuilder.findUserByClerkId(clerkId);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const sql = this.connection.getSql();
      await sql`DELETE FROM users WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Organism: User analytics
  async getUserAnalytics(userId: string): Promise<{
    profile: User | null;
    stats: any;
    activity: any;
  }> {
    try {
      const [profile, stats] = await Promise.all([
        this.findById(userId),
        this.queryBuilder.getUserStats(userId)
      ]);

      // Get recent activity
      const sql = this.connection.getSql();
      const recentActivity = await sql`
        SELECT 
          'looks_created' as activity_type,
          COUNT(*) as count,
          MAX(createdAt) as last_activity
        FROM looks 
        WHERE userId = ${userId} AND createdAt >= NOW() - INTERVAL '30 days'
        GROUP BY 'looks_created'
        
        UNION ALL
        
        SELECT 
          'collections_created' as activity_type,
          COUNT(*) as count,
          MAX(createdAt) as last_activity
        FROM collections 
        WHERE userId = ${userId} AND createdAt >= NOW() - INTERVAL '30 days'
        GROUP BY 'collections_created'
        
        ORDER BY last_activity DESC
        LIMIT 10
      `;

      return {
        profile,
        stats,
        activity: recentActivity
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  // Organism: User preferences and personalization
  async updatePreferences(userId: string, preferences: {
    favoriteBrands?: string[];
    preferredColors?: string[];
    stylePreferences?: string[];
    sizePreferences?: {
      tops?: string;
      bottoms?: string;
      shoes?: string;
    };
    budgetRange?: {
      min: number;
      max: number;
    };
  }): Promise<boolean> {
    try {
      const sql = this.connection.getSql();
      await sql`
        INSERT INTO user_preferences (userId, preferences, updatedAt)
        VALUES (${userId}, ${JSON.stringify(preferences)}, NOW())
        ON CONFLICT (userId) 
        DO UPDATE SET 
          preferences = EXCLUDED.preferences,
          updatedAt = NOW()
      `;
      return true;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  async getPreferences(userId: string): Promise<any> {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT preferences 
        FROM user_preferences 
        WHERE userId = ${userId}
        ORDER BY updatedAt DESC
        LIMIT 1
      `;
      
      return result[0]?.preferences ? JSON.parse(result[0].preferences) : {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  // Organism: User social features
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const sql = this.connection.getSql();
      await sql`
        INSERT INTO user_follows (followerId, followingId, createdAt)
        VALUES (${followerId}, ${followingId}, NOW())
        ON CONFLICT DO NOTHING
      `;
      return true;
    } catch (error) {
      console.error('Failed to follow user:', error);
      return false;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const sql = this.connection.getSql();
      await sql`
        DELETE FROM user_follows 
        WHERE followerId = ${followerId} AND followingId = ${followingId}
      `;
      return true;
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      return false;
    }
  }

  async getFollowers(userId: string, limit = 20, offset = 0): Promise<any[]> {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT 
          u.id, u.firstName, u.lastName, u.avatar, u.email,
          uf.createdAt as followed_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.followerId
        WHERE uf.followingId = ${userId}
        ORDER BY uf.createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      console.error('Failed to get followers:', error);
      return [];
    }
  }

  async getFollowing(userId: string, limit = 20, offset = 0): Promise<any[]> {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        SELECT 
          u.id, u.firstName, u.lastName, u.avatar, u.email,
          uf.createdAt as followed_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.followingId
        WHERE uf.followerId = ${userId}
        ORDER BY uf.createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      console.error('Failed to get following:', error);
      return [];
    }
  }

  // Organism: User recommendations
  async getRecommendedUsers(userId: string, limit = 10): Promise<any[]> {
    try {
      const sql = this.connection.getSql();
      const result = await sql`
        WITH user_preferences AS (
          SELECT preferences FROM user_preferences WHERE userId = ${userId}
        ),
        similar_users AS (
          SELECT 
            u.id, u.firstName, u.lastName, u.avatar,
            COUNT(*) as common_interests
          FROM users u
          JOIN looks l ON u.id = l.userId
          WHERE u.id != ${userId}
            AND EXISTS (
              SELECT 1 FROM user_preferences up2 
              WHERE up2.userId = u.id
            )
          GROUP BY u.id, u.firstName, u.lastName, u.avatar
          HAVING COUNT(*) > 0
          ORDER BY common_interests DESC
          LIMIT 50
        )
        SELECT 
          su.id, su.firstName, su.lastName, su.avatar,
          su.common_interests,
          CASE 
            WHEN EXISTS (SELECT 1 FROM user_follows uf WHERE uf.followerId = ${userId} AND uf.followingId = su.id) 
            THEN true 
            ELSE false 
          END as is_following
        FROM similar_users su
        WHERE NOT EXISTS (
          SELECT 1 FROM user_follows uf2 
          WHERE uf2.followerId = ${userId} AND uf2.followingId = su.id
        )
        ORDER BY su.common_interests DESC
        LIMIT ${limit}
      `;
      
      return result;
    } catch (error) {
      console.error('Failed to get recommended users:', error);
      return [];
    }
  }
}

// Export organism for composition
export { UserService as UserOrganism };
