import { sql } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  rollback?: string;
  created_at: Date;
}

export class MigrationManager {
  private migrations: Migration[] = [];

  constructor() {
    this.loadMigrations();
  }

  private loadMigrations(): void {
    // Load migration files (in production, these would be in a migrations folder)
    this.migrations = [
      {
        id: '001',
        name: 'initial_schema',
        sql: this.loadSchemaFile(),
        rollback: 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
        created_at: new Date('2025-01-01')
      }
    ];
  }

  private loadSchemaFile(): string {
    try {
      // In a real implementation, this would load from the actual schema file
      // For now, we'll reference the schema file that was created
      return readFileSync(join(__dirname, '../../database/schema.sql'), 'utf8');
    } catch (error) {
      console.error('Failed to load schema file:', error);
      return '';
    }
  }

  async createMigrationsTable(): Promise<void> {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS migrations (
          id VARCHAR(10) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64)
        )
      `;
    } catch (error) {
      console.error('Failed to create migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await sql`SELECT id FROM migrations ORDER BY id`;
      return result.map(row => row.id);
    } catch (error) {
      console.error('Failed to get executed migrations:', error);
      return [];
    }
  }

  async executeMigration(migration: Migration): Promise<void> {
    try {
      console.log(`Executing migration: ${migration.name} (${migration.id})`);
      
      // Start transaction
      await sql`BEGIN`;
      
      try {
        // Execute migration SQL
        await sql`${migration.sql}`;
        
        // Record migration
        await sql`
          INSERT INTO migrations (id, name, checksum)
          VALUES (${migration.id}, ${migration.name}, ${this.calculateChecksum(migration.sql)})
        `;
        
        await sql`COMMIT`;
        console.log(`Migration ${migration.name} completed successfully`);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } catch (error) {
      console.error(`Migration ${migration.name} failed:`, error);
      throw error;
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.rollback) {
      throw new Error(`Migration ${migration.name} does not support rollback`);
    }

    try {
      console.log(`Rolling back migration: ${migration.name} (${migration.id})`);
      
      await sql`BEGIN`;
      
      try {
        await sql`${migration.rollback}`;
        await sql`DELETE FROM migrations WHERE id = ${migration.id}`;
        
        await sql`COMMIT`;
        console.log(`Rollback of ${migration.name} completed successfully`);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } catch (error) {
      console.error(`Rollback of ${migration.name} failed:`, error);
      throw error;
    }
  }

  async migrate(): Promise<void> {
    try {
      await this.createMigrationsTable();
      
      const executed = await this.getExecutedMigrations();
      const pending = this.migrations.filter(m => !executed.includes(m.id));
      
      if (pending.length === 0) {
        console.log('No pending migrations');
        return;
      }
      
      console.log(`Found ${pending.length} pending migrations`);
      
      for (const migration of pending) {
        await this.executeMigration(migration);
      }
      
      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    try {
      const executed = await this.getExecutedMigrations();
      const toRollback = executed.slice(-steps).reverse();
      
      if (toRollback.length === 0) {
        console.log('No migrations to rollback');
        return;
      }
      
      console.log(`Rolling back ${toRollback.length} migrations`);
      
      for (const migrationId of toRollback) {
        const migration = this.migrations.find(m => m.id === migrationId);
        if (migration) {
          await this.rollbackMigration(migration);
        }
      }
      
      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  async status(): Promise<{
    executed: Migration[];
    pending: Migration[];
  }> {
    try {
      await this.createMigrationsTable();
      const executed = await this.getExecutedMigrations();
      
      return {
        executed: this.migrations.filter(m => executed.includes(m.id)),
        pending: this.migrations.filter(m => !executed.includes(m.id))
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return { executed: [], pending: [] };
    }
  }

  private calculateChecksum(sql: string): string {
    // Simple checksum calculation (in production, use SHA-256)
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();

// CLI functions for migration management
export async function runMigrations(): Promise<void> {
  await migrationManager.migrate();
}

export async function rollbackMigrations(steps: number = 1): Promise<void> {
  await migrationManager.rollback(steps);
}

export async function migrationStatus(): Promise<void> {
  const status = await migrationManager.status();
  
  console.log('\n=== Migration Status ===');
  console.log(`Executed: ${status.executed.length}`);
  console.log(`Pending: ${status.pending.length}`);
  
  if (status.executed.length > 0) {
    console.log('\nExecuted migrations:');
    status.executed.forEach(m => {
      console.log(`  ${m.id}: ${m.name}`);
    });
  }
  
  if (status.pending.length > 0) {
    console.log('\nPending migrations:');
    status.pending.forEach(m => {
      console.log(`  ${m.id}: ${m.name}`);
    });
  }
}
