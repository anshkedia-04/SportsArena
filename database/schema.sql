-- ============================================
-- SportArena - Database Schema
-- PostgreSQL Setup Script
-- ============================================

-- Drop tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS booking_slots CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS arenas CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS arena_owners CASCADE;

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ARENA OWNERS TABLE
-- ============================================
CREATE TABLE arena_owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ARENAS TABLE
-- ============================================
CREATE TABLE arenas (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES arena_owners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    map_url TEXT,
    sport_type VARCHAR(100) NOT NULL,
    price_day DECIMAL(10, 2) NOT NULL DEFAULT 500,
    price_night DECIMAL(10, 2) NOT NULL DEFAULT 800,
    price_weekend_day DECIMAL(10, 2),
    price_weekend_night DECIMAL(10, 2),
    open_hour INTEGER NOT NULL DEFAULT 6,
    peak_start_hour INTEGER NOT NULL DEFAULT 17,
    close_hour INTEGER NOT NULL DEFAULT 23,
    image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    description TEXT,
    contact VARCHAR(255),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    coupon_code VARCHAR(50),
    discount_value DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SLOTS TABLE
-- ============================================
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    arena_id INTEGER REFERENCES arenas(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'available', -- available, booked, blocked, maintenance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(arena_id, date, start_time)
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    arena_id INTEGER REFERENCES arenas(id) ON DELETE CASCADE,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    upi_id VARCHAR(255),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, checked-in, no-show
    payment_status VARCHAR(50) DEFAULT 'paid',
    is_public BOOLEAN DEFAULT false,
    max_players INTEGER DEFAULT 10,
    applied_coupon VARCHAR(50),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BOOKING_SLOTS JUNCTION TABLE (Multi-hour support)
-- ============================================
CREATE TABLE booking_slots (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
    UNIQUE(slot_id) -- A slot can only be in one booking
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    arena_id INTEGER REFERENCES arenas(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WAITLIST TABLE
-- ============================================
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    arena_id INTEGER REFERENCES arenas(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, arena_id, date, start_time)
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_arenas_owner ON arenas(owner_id);
CREATE INDEX idx_arenas_sport ON arenas(sport_type);
CREATE INDEX idx_slots_arena ON slots(arena_id);
CREATE INDEX idx_slots_date ON slots(arena_id, date);
CREATE INDEX idx_slots_available ON slots(is_available);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_arena ON bookings(arena_id);
CREATE INDEX idx_reviews_arena ON reviews(arena_id);
CREATE INDEX idx_waitlist_slot ON waitlist(arena_id, date, start_time);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id INTEGER, -- Can be from customers or arena_owners
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pass_plans (
    id SERIAL PRIMARY KEY,
    arena_id INTEGER REFERENCES arenas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    credits INTEGER NOT NULL,
    validity_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_passes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    pass_plan_id INTEGER REFERENCES pass_plans(id) ON DELETE CASCADE,
    credits_remaining INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
