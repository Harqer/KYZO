import { sql } from '../config/database';

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionInput {
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export class CollectionModel {
  static async create(collectionData: CreateCollectionInput): Promise<Collection> {
    const result = await sql`
      INSERT INTO collections (user_id, name, description, cover_image_url, is_public)
      VALUES (${collectionData.userId}, ${collectionData.name}, ${collectionData.description || null}, ${collectionData.coverImageUrl || null}, ${collectionData.isPublic || false})
      RETURNING *
    `;
    return result[0] as Collection;
  }

  static async findById(id: string): Promise<Collection | null> {
    const result = await sql`
      SELECT * FROM collections WHERE id = ${id}
    `;
    return result[0] as Collection || null;
  }

  static async findByUserId(userId: string, limit = 20, offset = 0): Promise<Collection[]> {
    const result = await sql`
      SELECT * FROM collections 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result as Collection[];
  }

  static async findPublicCollections(limit = 20, offset = 0): Promise<Collection[]> {
    const result = await sql`
      SELECT c.*, u.username, u.full_name
      FROM collections c
      JOIN users u ON c.user_id = u.id
      WHERE c.is_public = true
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result as Collection[];
  }

  static async update(id: string, collectionData: Partial<CreateCollectionInput>): Promise<Collection | null> {
    const fields = [];
    const values = [];
    
    if (collectionData.name !== undefined) {
      fields.push('name = $' + (fields.length + 1));
      values.push(collectionData.name);
    }
    if (collectionData.description !== undefined) {
      fields.push('description = $' + (fields.length + 1));
      values.push(collectionData.description);
    }
    if (collectionData.coverImageUrl !== undefined) {
      fields.push('cover_image_url = $' + (fields.length + 1));
      values.push(collectionData.coverImageUrl);
    }
    if (collectionData.isPublic !== undefined) {
      fields.push('is_public = $' + (fields.length + 1));
      values.push(collectionData.isPublic);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    values.push(id);
    
    const result = await sql`
      UPDATE collections 
      SET ${sql.unsafe(fields.join(', '))}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Collection || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM collections WHERE id = ${id} AND user_id = ${userId}
    `;
    return result.length > 0;
  }

  static async getCollectionWithLooks(id: string, userId?: string): Promise<any> {
    const query = userId 
      ? sql`
          SELECT 
            c.*,
            u.username,
            u.full_name,
            COUNT(l.id) as look_count
          FROM collections c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN looks l ON c.id = l.collection_id
          WHERE c.id = ${id} AND (c.user_id = ${userId} OR c.is_public = true)
          GROUP BY c.id, u.id
        `
      : sql`
          SELECT 
            c.*,
            u.username,
            u.full_name,
            COUNT(l.id) as look_count
          FROM collections c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN looks l ON c.id = l.collection_id
          WHERE c.id = ${id} AND c.is_public = true
          GROUP BY c.id, u.id
        `;
    
    const result = await query;
    return result[0] || null;
  }
}
