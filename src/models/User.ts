import { sql } from '../config/database';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
}

export class UserModel {
  static async create(userData: CreateUserInput): Promise<User> {
    const result = await sql`
      INSERT INTO users (id, email, username, full_name, profile_image_url)
      VALUES (${userData.id}, ${userData.email}, ${userData.username || null}, ${userData.fullName || null}, ${userData.profileImageUrl || null})
      RETURNING *
    `;
    return result[0] as User;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result[0] as User || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0] as User || null;
  }

  static async update(id: string, userData: Partial<CreateUserInput>): Promise<User | null> {
    const fields = [];
    const values = [];
    
    if (userData.username !== undefined) {
      fields.push('username = $' + (fields.length + 1));
      values.push(userData.username);
    }
    if (userData.fullName !== undefined) {
      fields.push('full_name = $' + (fields.length + 1));
      values.push(userData.fullName);
    }
    if (userData.profileImageUrl !== undefined) {
      fields.push('profile_image_url = $' + (fields.length + 1));
      values.push(userData.profileImageUrl);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    values.push(id);
    
    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(fields.join(', '))}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as User || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM users WHERE id = ${id}
    `;
    return result.length > 0;
  }

  static async syncWithClerk(clerkUser: any): Promise<User> {
    const existingUser = await this.findById(clerkUser.id);
    
    if (existingUser) {
      return this.update(clerkUser.id, {
        email: clerkUser.emailAddresses[0]?.emailAddress,
        username: clerkUser.username,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined,
        profileImageUrl: clerkUser.imageUrl,
      }) as Promise<User>;
    } else {
      return this.create({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        username: clerkUser.username,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined,
        profileImageUrl: clerkUser.imageUrl,
      });
    }
  }
}
