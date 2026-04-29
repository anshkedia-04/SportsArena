const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetDb() {
  try {
    console.log('Reading schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    
    console.log('Executing schema...');
    await pool.query(schema);
    
    console.log('Database reset successful!');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await pool.end();
  }
}

resetDb();
