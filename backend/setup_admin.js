const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupAdmin() {
  try {
    console.log('Creating admins table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const email = 'admin@sportarena.com';
    const password = 'password123'; // Standard secure test password
    
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)', ['Super Admin', email, hashedPassword]);
      console.log('✅ Default super admin created: ' + email + ' / ' + password);
    } else {
      console.log('✅ Admin already exists.');
    }
    
  } catch (err) {
    console.error('Error setting up admin:', err);
  } finally {
    pool.end();
  }
}

setupAdmin();
