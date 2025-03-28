import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as Sentry from '@sentry/node';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/workload",
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Initialize database
export const initializeDatabase = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connection initialized successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    Sentry.captureException(error);
    throw new Error('Database connection failed');
  }
};