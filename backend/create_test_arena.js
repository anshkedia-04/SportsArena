const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const owner = await pool.query(
      "INSERT INTO arena_owners (name, email, password) VALUES ('Test Owner " + Date.now() + "', 'owner" + Date.now() + "@example.com', 'pass123') RETURNING id"
    );
    const ownerId = owner.rows[0].id;

    const arena = await pool.query(
      `INSERT INTO arenas (owner_id, name, location, sport_type, price_day, price_night, open_hour, peak_start_hour, close_hour)
       VALUES ($1, 'Browser Test Arena', 'Mumbai', 'football', 500, 800, 6, 17, 23) RETURNING id`,
      [ownerId]
    );
    const arenaId = arena.rows[0].id;

    console.log(`Arena created with ID: ${arenaId}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
