import { sql } from '../config/database';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    
    console.log('Database schema initialized successfully!');
    
    // Test the connection
    const result = await sql`SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(`Created ${result[0].table_count} tables`);
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };
