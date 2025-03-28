import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Main migration function
async function main() {
  console.log('Starting database migration...');
  
  // Create a PostgreSQL connection
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/workload';
  const pool = new Pool({ connectionString });
  
  // Create Drizzle instance
  const db = drizzle(pool);
  
  // Run migrations
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
  process.exit(0);
}

// Run the main function
main();
