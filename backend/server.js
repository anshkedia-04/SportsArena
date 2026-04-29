// ============================================
// SportArena - Backend Server (Single File)
// Express + PostgreSQL + JWT Authentication
// Tiered Pricing + Auto-Slot Generation + Multi-Hour Booking
// ============================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sportarena_secret_key_2024';

// ============================================
// DATABASE CONNECTION
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ Database connection error:', err.message));

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Super Admin account required.' });
  }
  next();
};

const requireBusiness = (req, res, next) => {
  if (!req.user || req.user.role !== 'business') {
    return res.status(403).json({ error: 'Access denied. Business account required.' });
  }
  next();
};

// ============================================
// AUTH ROUTES
// ============================================
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!['business', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "business" or "customer".' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const table = role === 'business' ? 'arena_owners' : 'customers';
    
    // Check if email exists in EITHER table
    const existingCustomer = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
    const existingOwner = await pool.query('SELECT id FROM arena_owners WHERE email = $1', [email]);
    
    if (existingCustomer.rows.length > 0 || existingOwner.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO ${table} (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, hashedPassword]
    );
    
    const user = { ...result.rows[0], role };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    
    let user;
    let role;
    
    const adminRes = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (adminRes.rows.length > 0) {
      user = adminRes.rows[0];
      role = 'admin';
    } else {
      const customerRes = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      if (customerRes.rows.length > 0) {
        user = customerRes.rows[0];
        role = 'customer';
      } else {
        const ownerRes = await pool.query('SELECT * FROM arena_owners WHERE email = $1', [email]);
        if (ownerRes.rows.length > 0) {
          user = ownerRes.rows[0];
          role = 'business';
        }
      }
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: role, name: user.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ user: { ...user, password: null, role }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/auth/me', authenticate, async (req, res) => {
  try {
    const table = req.user.role === 'admin' ? 'admins' : req.user.role === 'business' ? 'arena_owners' : 'customers';
    const result = await pool.query(`SELECT id, name, email FROM ${table} WHERE id = $1`, [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ ...result.rows[0], role: req.user.role });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// SLOT AUTO-GENERATION HELPER
// ============================================
async function ensureSlotsForDays(arenaId, days = 7) {
  const arenaRes = await pool.query('SELECT * FROM arenas WHERE id = $1', [arenaId]);
  if (arenaRes.rows.length === 0) return;
  const arena = arenaRes.rows[0];
  const { open_hour, peak_start_hour, close_hour, price_day, price_night, price_weekend_day, price_weekend_night } = arena;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

    for (let h = open_hour; h < close_hour; h++) {
      const start = `${h.toString().padStart(2, '0')}:00:00`;
      const end = `${(h + 1).toString().padStart(2, '0')}:00:00`;
      
      let price = h < peak_start_hour ? price_day : price_night;
      if (isWeekend) {
        price = h < peak_start_hour ? (price_weekend_day || price_day) : (price_weekend_night || price_night);
      }

      try {
        await pool.query(
          `INSERT INTO slots (arena_id, date, start_time, end_time, price, is_available)
           VALUES ($1, $2, $3, $4, $5, true)
           ON CONFLICT (arena_id, date, start_time) DO NOTHING`,
          [arenaId, dateStr, start, end, price]
        );
      } catch (err) {}
    }
  }
}

// ============================================
// CHAT ROUTES
// ============================================
app.get('/messages/:booking_id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE booking_id = $1 ORDER BY created_at ASC',
      [req.params.booking_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PASS ROUTES
// ============================================
app.get('/arenas/:id/passes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pass_plans WHERE arena_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/pass-plans', authenticate, requireBusiness, async (req, res) => {
  try {
    const { arena_id, name, price, credits, validity_days } = req.body;
    const result = await pool.query(
      'INSERT INTO pass_plans (arena_id, name, price, credits, validity_days) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [arena_id, name, price, credits, validity_days || 30]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/buy-pass', authenticate, async (req, res) => {
  try {
    const { pass_plan_id } = req.body;
    const planRes = await pool.query('SELECT * FROM pass_plans WHERE id = $1', [pass_plan_id]);
    const plan = planRes.rows[0];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.validity_days);
    
    const result = await pool.query(
      'INSERT INTO user_passes (user_id, pass_plan_id, credits_remaining, expires_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, pass_plan_id, plan.credits, expiresAt]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/my-passes', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT up.*, pp.name as plan_name, a.name as arena_name, a.id as arena_id 
       FROM user_passes up 
       JOIN pass_plans pp ON up.pass_plan_id = pp.id 
       JOIN arenas a ON pp.arena_id = a.id 
       WHERE up.user_id = $1 AND up.credits_remaining > 0 AND up.expires_at > NOW()`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================
// ARENA ROUTES
// ============================================
app.get('/arenas', async (req, res) => {
  try {
    const { sport_type, min_price, max_price, location, search, lat, lng, date, start_time, end_time } = req.query;
    let query = 'SELECT a.*, o.name as owner_name';
    const params = [];
    let paramIndex = 1;

    if (lat && lng) {
      query += `, (6371 * acos(cos(radians($${paramIndex})) * cos(radians(latitude)) * cos(radians(longitude) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(latitude)))) AS distance`;
      params.push(lat, lng);
      paramIndex += 2;
    }

    query += ' FROM arenas a JOIN arena_owners o ON a.owner_id = o.id WHERE is_verified = true';

    if (sport_type) { query += ` AND LOWER(a.sport_type) LIKE LOWER($${paramIndex++})`; params.push(`%${sport_type}%`); }
    if (min_price) { query += ` AND a.price_day >= $${paramIndex++}`; params.push(min_price); }
    if (max_price) { query += ` AND a.price_day <= $${paramIndex++}`; params.push(max_price); }
    if (location) { query += ` AND LOWER(a.location) LIKE LOWER($${paramIndex++})`; params.push(`%${location}%`); }
    if (search) { query += ` AND (LOWER(a.name) LIKE LOWER($${paramIndex}) OR LOWER(a.description) LIKE LOWER($${paramIndex}))`; params.push(`%${search}%`); paramIndex++; }

    // Availability Filter
    if (date && start_time && end_time) {
      query += ` AND EXISTS (
        SELECT 1 FROM slots s 
        WHERE s.arena_id = a.id 
        AND s.date = $${paramIndex++} 
        AND s.start_time >= $${paramIndex++} 
        AND s.end_time <= $${paramIndex++} 
        AND s.is_available = true
      )`;
      params.push(date, start_time, end_time);
    }

    if (lat && lng) {
      query += ' ORDER BY distance ASC';
    } else {
      query += ' ORDER BY a.created_at DESC';
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch arenas error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/arenas/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, o.name as owner_name FROM arenas a JOIN arena_owners o ON a.owner_id = o.id WHERE a.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Arena not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/arenas', authenticate, requireBusiness, async (req, res) => {
  try {
    const { name, location, address, map_url, sport_type, price_day, price_night, price_weekend_day, price_weekend_night, open_hour, peak_start_hour, close_hour, image_url, description, contact, latitude, longitude, coupon_code, discount_value, license_url } = req.body;
    const result = await pool.query(
      `INSERT INTO arenas (owner_id, name, location, address, map_url, sport_type, price_day, price_night, price_weekend_day, price_weekend_night, open_hour, peak_start_hour, close_hour, image_url, description, contact, latitude, longitude, coupon_code, discount_value, license_url, verification_status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'pending', false) RETURNING *`,
      [req.user.id, name, location, address, map_url, sport_type, price_day, price_night, price_weekend_day || price_day, price_weekend_night || price_night, open_hour || 6, peak_start_hour || 17, close_hour || 23, image_url, description, contact, latitude, longitude, coupon_code, discount_value || 0, license_url]
    );
    await ensureSlotsForDays(result.rows[0].id, 7);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create arena error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/arenas/:id', authenticate, requireBusiness, async (req, res) => {
  try {
    const arena = await pool.query('SELECT owner_id FROM arenas WHERE id = $1', [req.params.id]);
    if (arena.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const { name, location, address, map_url, sport_type, price_day, price_night, price_weekend_day, price_weekend_night, open_hour, peak_start_hour, close_hour, image_url, description, contact, latitude, longitude, coupon_code, discount_value, license_url } = req.body;
    const result = await pool.query(
      `UPDATE arenas SET name=COALESCE($1,name), location=COALESCE($2,location), address=COALESCE($3,address), map_url=COALESCE($4,map_url), sport_type=COALESCE($5,sport_type), price_day=COALESCE($6,price_day), price_night=COALESCE($7,price_night), price_weekend_day=COALESCE($8,price_weekend_day), price_weekend_night=COALESCE($9,price_weekend_night), open_hour=COALESCE($10,open_hour), peak_start_hour=COALESCE($11,peak_start_hour), close_hour=COALESCE($12,close_hour), image_url=COALESCE($13,image_url), description=COALESCE($14,description), contact=COALESCE($15,contact), latitude=COALESCE($16,latitude), longitude=COALESCE($17,longitude), coupon_code=COALESCE($18,coupon_code), discount_value=COALESCE($19,discount_value), license_url=COALESCE($20,license_url) WHERE id=$21 RETURNING *`,
      [name, location, address, map_url, sport_type, price_day, price_night, price_weekend_day, price_weekend_night, open_hour, peak_start_hour, close_hour, image_url, description, contact, latitude, longitude, coupon_code, discount_value, license_url, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/arenas/my/list', authenticate, requireBusiness, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM arenas WHERE owner_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// SLOT ROUTES
// ============================================
app.get('/slots/:arenaId', async (req, res) => {
  try {
    const arenaId = req.params.arenaId;
    await ensureSlotsForDays(arenaId, 7);
    
    // Fetch slots for next 8 days to be safe
    const result = await pool.query(
      `SELECT * FROM slots WHERE arena_id = $1 AND date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date 
       ORDER BY date, start_time`,
      [arenaId]
    );
    
    // Filtering logic in JS for absolute reliability
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(nowIST);
    
    // Next hour threshold
    const threshold = new Date(nowIST.getTime() + 3600000);

    const filtered = result.rows.filter(slot => {
      const slotDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(slot.date));
      
      // If it's a future date, it's always allowed
      if (slotDate > todayStr) return true;
      
      // If it's today, check if start_time is >= threshold
      if (slotDate === todayStr) {
        const [h, m, s] = slot.start_time.split(':');
        const slotTime = new Date(nowIST);
        slotTime.setHours(parseInt(h), parseInt(m), parseInt(s), 0);
        return slotTime >= threshold;
      }
      
      return false;
    });

    res.json(filtered);
  } catch (err) {
    console.error('Slot fetch error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// COUPON ROUTES
// ============================================
app.post('/coupons/validate', async (req, res) => {
  try {
    const { arena_id, coupon_code } = req.body;
    if (!arena_id || !coupon_code) return res.status(400).json({ error: 'Arena ID and coupon code are required.' });
    
    const result = await pool.query('SELECT coupon_code, discount_value FROM arenas WHERE id = $1', [arena_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Arena not found.' });
    
    const arena = result.rows[0];
    if (arena.coupon_code && arena.coupon_code.toUpperCase() === coupon_code.toUpperCase()) {
      res.json({ valid: true, discount_value: arena.discount_value });
    } else {
      res.json({ valid: false, error: 'Invalid coupon code.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// BOOKING ROUTES
// ============================================
app.get('/bookings/public', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.max_players, b.guest_name as customer_name, a.name as arena_name, a.sport_type, 
             s.date as slot_date, s.start_time
      FROM bookings b
      JOIN arenas a ON b.arena_id = a.id
      JOIN booking_slots bs ON b.id = bs.booking_id
      JOIN slots s ON bs.slot_id = s.id
      WHERE b.is_public = true AND b.status = 'confirmed' AND s.date >= CURRENT_DATE
      ORDER BY s.date, s.start_time
    `);
    
    // Deduplicate bookings that have multiple slots, showing only the earliest slot time
    const uniqueBookings = [];
    const seen = new Set();
    for (const row of result.rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        uniqueBookings.push(row);
      }
    }
    res.json(uniqueBookings);
  } catch (err) {
    console.error('Fetch public bookings error:', err);
    res.status(500).json({ error: 'Server error fetching public games.' });
  }
});

app.post('/bookings', optionalAuthenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { slot_ids, arena_id, user_name, user_email, user_phone, amount, payment_method, upi_id, password, is_public, max_players, coupon_code, pass_id } = req.body;
    let userId = req.user ? req.user.id : null;

    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      return res.status(400).json({ error: 'At least one slot must be selected.' });
    }

    await client.query('BEGIN');

    // 1. Race Condition Prevention: Lock the slots
    // We use SELECT FOR UPDATE to lock the rows so no other transaction can book them
    const slotsCheck = await client.query(
      'SELECT id, is_available, date, start_time FROM slots WHERE id = ANY($1) FOR UPDATE',
      [slot_ids]
    );

    if (slotsCheck.rows.length !== slot_ids.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'One or more selected slots do not exist.' });
    }

    for (const slot of slotsCheck.rows) {
      if (!slot.is_available) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: `Slot at ${slot.start_time} is already booked or unavailable.` });
      }

      // 2. Advanced Booking Rules
      const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const slotDate = new Date(slot.date);
      const [h, m, s] = slot.start_time.split(':');
      const slotTime = new Date(slotDate);
      slotTime.setHours(parseInt(h), parseInt(m), parseInt(s), 0);

      // Rule: No bookings < 1 hour before start
      const oneHourFromNow = new Date(nowIST.getTime() + 3600000);
      if (slotTime < oneHourFromNow) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bookings must be made at least 1 hour in advance.' });
      }

      // Rule: No bookings > 30 days in advance
      const thirtyDaysFromNow = new Date(nowIST.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (slotTime > thirtyDaysFromNow) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bookings cannot be made more than 30 days in advance.' });
      }
    }

    // 3. Handle guest auto-registration
    if (!userId && user_email && password) {
      const existing = await client.query('SELECT id FROM customers WHERE email = $1', [user_email]);
      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await client.query(
          'INSERT INTO customers (name, email, password) VALUES ($1, $2, $3) RETURNING id',
          [user_name, user_email, hashedPassword]
        );
        userId = newUser.rows[0].id;
      } else {
        userId = existing.rows[0].id;
      }
    }

    // 4. Handle Coupon
    let finalAmount = parseFloat(amount);
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const arenaRes = await client.query('SELECT coupon_code, discount_value FROM arenas WHERE id = $1', [arena_id]);
      const arena = arenaRes.rows[0];
      if (arena && arena.coupon_code && arena.coupon_code.toUpperCase() === coupon_code.toUpperCase()) {
        discountAmount = parseFloat(arena.discount_value);
        appliedCoupon = arena.coupon_code;
        finalAmount = Math.max(0, finalAmount - discountAmount);
      }
    }

    // 5. Create Booking
    const txnId = payment_method === 'credits' ? 'CREDIT' + Math.random().toString(36).substr(2, 9).toUpperCase() : 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    if (payment_method === 'credits') {
      if (!pass_id) throw new Error('Pass ID is required for credit payment');
      const passRes = await client.query('SELECT credits_remaining FROM user_passes WHERE id = $1 AND user_id = $2', [pass_id, userId]);
      if (passRes.rows.length === 0 || passRes.rows[0].credits_remaining < slot_ids.length) {
        throw new Error('Insufficient credits in pass');
      }
      await client.query('UPDATE user_passes SET credits_remaining = credits_remaining - $1 WHERE id = $2', [slot_ids.length, pass_id]);
    }

    const bookingRes = await client.query(
      `INSERT INTO bookings (user_id, arena_id, amount, payment_method, upi_id, transaction_id, payment_status, guest_name, guest_email, guest_phone, is_public, max_players, applied_coupon, discount_amount)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [userId, arena_id, finalAmount, payment_method, upi_id, txnId, user_name, user_email, user_phone, is_public || false, max_players || 10, appliedCoupon, discountAmount]
    );
    const bookingId = bookingRes.rows[0].id;

    // 5. Link slots and mark as unavailable
    for (const slotId of slot_ids) {
      await client.query('INSERT INTO booking_slots (booking_id, slot_id) VALUES ($1, $2)', [bookingId, slotId]);
      await client.query("UPDATE slots SET is_available = false, status = 'booked' WHERE id = $1", [slotId]);
    }

    await client.query('COMMIT');
    
    // Real-time notification: Slot Update
    io.emit('slots_updated', { arena_id, slot_ids });
    
    // Real-time notification: Booking Confirmed (to the user)
    if (userId) {
      io.to(`user_${userId}`).emit('notification', { 
        type: 'booking_confirmed', 
        message: `Booking confirmed for ${arena_id}!`,
        booking: bookingRes.rows[0]
      });
    }

    res.status(201).json(bookingRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Server error during booking.' });
  } finally {
    client.release();
  }
});

app.put('/bookings/:id/cancel', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;
    await client.query('BEGIN');

    const booking = await client.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (booking.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    
    // Check if it belongs to user
    if (booking.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // Update status
    await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [bookingId]);

    // Free up slots
    const slots = await client.query('SELECT slot_id FROM booking_slots WHERE booking_id = $1', [bookingId]);
    const slotIds = slots.rows.map(s => s.slot_id);

    if (slotIds.length > 0) {
      await client.query("UPDATE slots SET is_available = true, status = 'available' WHERE id = ANY($1)", [slotIds]);
      
      // WAITLIST NOTIFICATION LOGIC (MOCK)
      for (const slotId of slotIds) {
        const slot = await client.query('SELECT arena_id, date, start_time FROM slots WHERE id = $1', [slotId]);
        const { arena_id, date, start_time } = slot.rows[0];
        const waiters = await client.query('SELECT user_id FROM waitlist WHERE arena_id = $1 AND date = $2 AND start_time = $3', [arena_id, date, start_time]);
        
        if (waiters.rows.length > 0) {
          console.log(`🔔 MOCK NOTIFICATION: Notifying ${waiters.rows.length} users that slot ${start_time} on ${date} at Arena ${arena_id} is now available!`);
          // In a real app, you'd send emails/push notifications here
        }
      }
    }

    await client.query('COMMIT');

    // Real-time notification: Slots freed up
    io.emit('slots_updated', { arena_id: booking.rows[0].arena_id, slot_ids: slotIds });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

app.put('/bookings/:id/status', authenticate, requireBusiness, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'checked-in', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// WAITLIST ROUTES
// ============================================
app.post('/waitlist', authenticate, async (req, res) => {
  try {
    const { arena_id, date, start_time } = req.body;
    await pool.query(
      'INSERT INTO waitlist (user_id, arena_id, date, start_time) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [req.user.id, arena_id, date, start_time]
    );
    res.status(201).json({ message: 'Added to waitlist' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// REVIEWS ROUTES
// ============================================
app.post('/reviews', authenticate, async (req, res) => {
  try {
    const { arena_id, booking_id, rating, comment } = req.body;
    
    // Check if booking belongs to user and is finished
    const booking = await pool.query(
      `SELECT b.*, s.date, s.end_time 
       FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id JOIN slots s ON bs.slot_id = s.id
       WHERE b.id = $1 AND b.user_id = $2 ORDER BY s.date DESC, s.end_time DESC LIMIT 1`,
      [booking_id, req.user.id]
    );

    if (booking.rows.length === 0) return res.status(403).json({ error: 'Invalid booking' });

    // In a real app, check if current time > booking end time
    
    await pool.query(
      'INSERT INTO reviews (user_id, arena_id, booking_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, arena_id, booking_id, rating, comment]
    );
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/arenas/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, c.name as user_name FROM reviews r JOIN customers c ON r.user_id = c.id WHERE r.arena_id = $1 ORDER BY r.created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================
app.get('/dashboard/analytics', authenticate, requireBusiness, async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    // Revenue by sport
    const bySport = await pool.query(
      `SELECT a.sport_type, SUM(b.amount) as revenue, COUNT(b.id) as bookings
       FROM bookings b JOIN arenas a ON b.arena_id = a.id
       WHERE a.owner_id = $1 GROUP BY a.sport_type`, [ownerId]
    );

    // Peak hours
    const peakHours = await pool.query(
      `SELECT s.start_time, COUNT(bs.id) as count
       FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id JOIN arenas a ON s.arena_id = a.id
       WHERE a.owner_id = $1 GROUP BY s.start_time ORDER BY count DESC`, [ownerId]
    );

    // Customer retention (returning vs new)
    const retention = await pool.query(
      `WITH user_counts AS (
         SELECT b.user_id, COUNT(b.id) as booking_count
         FROM bookings b JOIN arenas a ON b.arena_id = a.id
         WHERE a.owner_id = $1 AND b.user_id IS NOT NULL
         GROUP BY b.user_id
       )
       SELECT 
         COUNT(*) FILTER (WHERE booking_count > 1) as returning_customers,
         COUNT(*) FILTER (WHERE booking_count = 1) as new_customers
       FROM user_counts`, [ownerId]
    );

    res.json({
      bySport: bySport.rows || [],
      peakHours: peakHours.rows || [],
      retention: retention.rows[0] || { returning_customers: 0, new_customers: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/bookings/arena/:id', authenticate, requireBusiness, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as customer_name, c.email as customer_email,
              (SELECT s.date FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as slot_date,
              (SELECT s.start_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as start_time,
              (SELECT s.end_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.end_time DESC LIMIT 1) as end_time
       FROM bookings b LEFT JOIN customers c ON b.user_id = c.id
       WHERE b.arena_id = $1 ORDER BY b.created_at DESC`, [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// MANUAL OVERRIDE
// ============================================
app.post('/slots/block', authenticate, requireBusiness, async (req, res) => {
  try {
    const { slot_id, slot_ids, status } = req.body; 
    const ids = slot_ids || [slot_id];
    await pool.query(
      "UPDATE slots SET is_available = false, status = $1 WHERE id = ANY($2)",
      [status || 'blocked', ids]
    );
    res.json({ message: 'Slots blocked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/bookings/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, a.name as arena_name, 
              (SELECT s.date FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as slot_date,
              (SELECT s.start_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as start_time,
              (SELECT s.end_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.end_time DESC LIMIT 1) as end_time
       FROM bookings b JOIN arenas a ON b.arena_id = a.id 
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`, [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/dashboard/stats', authenticate, requireBusiness, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const arenas = await pool.query('SELECT COUNT(*) FROM arenas WHERE owner_id = $1', [ownerId]);
    const bookings = await pool.query('SELECT COUNT(*) FROM bookings b JOIN arenas a ON b.arena_id = a.id WHERE a.owner_id = $1', [ownerId]);
    const revenue = await pool.query('SELECT SUM(amount) FROM bookings b JOIN arenas a ON b.arena_id = a.id WHERE a.owner_id = $1', [ownerId]);
    const recent = await pool.query(
      `SELECT b.*, COALESCE(c.name, b.guest_name) as customer_name, a.name as arena_name, 
              (SELECT s.date FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as slot_date,
              (SELECT s.start_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as start_time,
              (SELECT s.end_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.end_time DESC LIMIT 1) as end_time
       FROM bookings b LEFT JOIN customers c ON b.user_id = c.id JOIN arenas a ON b.arena_id = a.id 
       WHERE a.owner_id = $1 ORDER BY b.created_at DESC LIMIT 5`, [ownerId]
    );
    res.json({
      totalArenas: parseInt(arenas.rows[0].count),
      totalBookings: parseInt(bookings.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].sum || 0),
      recentBookings: recent.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// ADMIN SUPER ACCESS ROUTES
// ============================================

app.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const customers = await pool.query('SELECT COUNT(*) FROM customers');
    const owners = await pool.query('SELECT COUNT(*) FROM arena_owners');
    const arenas = await pool.query('SELECT COUNT(*) FROM arenas');
    const bookings = await pool.query('SELECT COUNT(*) FROM bookings');
    const revenue = await pool.query('SELECT SUM(amount) FROM bookings');
    const pendingVerifications = await pool.query('SELECT COUNT(*) FROM arenas WHERE verification_status = \'pending\'');
    
    res.json({
      totalCustomers: parseInt(customers.rows[0].count),
      totalOwners: parseInt(owners.rows[0].count),
      totalArenas: parseInt(arenas.rows[0].count),
      totalBookings: parseInt(bookings.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].sum || 0),
      pendingVerifications: parseInt(pendingVerifications.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const customers = await pool.query('SELECT id, name, email, created_at, \'customer\' as role FROM customers ORDER BY created_at DESC');
    const owners = await pool.query('SELECT id, name, email, created_at, \'owner\' as role FROM arena_owners ORDER BY created_at DESC');
    res.json({ customers: customers.rows, owners: owners.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/admin/arenas', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, o.name as owner_name, o.email as owner_email,
             (SELECT COUNT(*) FROM bookings b WHERE b.arena_id = a.id) as booking_count,
             (SELECT SUM(amount) FROM bookings b WHERE b.arena_id = a.id) as total_revenue
      FROM arenas a
      JOIN arena_owners o ON a.owner_id = o.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/admin/bookings', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, COALESCE(c.name, b.guest_name) as customer_name, a.name as arena_name, o.name as owner_name,
             (SELECT s.date FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as slot_date,
             (SELECT s.start_time FROM booking_slots bs JOIN slots s ON bs.slot_id = s.id WHERE bs.booking_id = b.id ORDER BY s.start_time LIMIT 1) as start_time
      FROM bookings b
      LEFT JOIN customers c ON b.user_id = c.id
      JOIN arenas a ON b.arena_id = a.id
      JOIN arena_owners o ON a.owner_id = o.id
      ORDER BY b.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/admin/arenas/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM arenas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Arena deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/admin/users/:role/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const table = req.params.role === 'customer' ? 'customers' : 'arena_owners';
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.delete('/admin/bookings/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/admin/arenas/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const isVerified = status === 'verified';
    await pool.query('UPDATE arenas SET verification_status = $1, is_verified = $2 WHERE id = $3', [status, isVerified, req.params.id]);
    res.json({ message: `Arena status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// SOCKET.IO CONNECTION
// ============================================
io.on('connection', (socket) => {
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_chat', (bookingId) => {
    socket.join(`chat_${bookingId}`);
  });

  socket.on('send_message', async (data) => {
    const { booking_id, sender_id, sender_name, message } = data;
    try {
      // Logic to determine if sender is customer or owner could be added here
      const result = await pool.query(
        'INSERT INTO messages (booking_id, sender_id, sender_name, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [booking_id, sender_id, sender_name, message]
      );
      io.to(`chat_${booking_id}`).emit('receive_message', result.rows[0]);
    } catch (err) {
      console.error('Chat error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected');
  });
});

// ============================================
// BACKGROUND TASKS
// ============================================
setInterval(async () => {
  try {
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 1);
    const dateStr = reminderTime.toISOString().split('T')[0];
    const timeStr = reminderTime.toTimeString().split(' ')[0].substring(0, 5) + ':00';

    const result = await pool.query(
      `SELECT b.*, a.name as arena_name, s.date as slot_date, s.start_time 
       FROM bookings b 
       JOIN arenas a ON b.arena_id = a.id 
       JOIN booking_slots bs ON b.id = bs.booking_id
       JOIN slots s ON bs.slot_id = s.id
       WHERE s.date = $1 AND s.start_time = $2 AND b.status = 'confirmed'`,
      [dateStr, timeStr]
    );

    result.rows.forEach(booking => {
      if (booking.user_id) {
        io.to(`user_${booking.user_id}`).emit('notification', {
          type: 'reminder',
          message: `Reminder: Your booking at ${booking.arena_name} starts in 1 hour!`
        });
      }
    });
  } catch (err) {
    console.error('Reminder task error:', err);
  }
}, 60000); // Check every minute

server.listen(PORT, () => console.log(`Server on ${PORT}`));
