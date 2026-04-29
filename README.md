# 🏟️ SportArena — Sports Arena Booking Platform

A production-ready MVP for booking sports arenas. Dual portal for **Business Owners** and **Customers**.

---

## 🚀 Quick Start

### 1. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name sportarena-db \
  -e POSTGRES_USER=sportarena \
  -e POSTGRES_PASSWORD=sportarena123 \
  -e POSTGRES_DB=sportarena \
  -p 5432:5432 \
  postgres:16-alpine
```

**Connection String:**
```
postgresql://sportarena:sportarena123@localhost:5432/sportarena
```

### 2. Setup Database

```bash
# Wait a few seconds for Postgres to start, then run:
docker exec -i sportarena-db psql -U sportarena -d sportarena < database/schema.sql
```

Or connect via any SQL client and run `database/schema.sql`.

### 3. Start Backend

```bash
cd backend
npm install
npm start
```

The API will be running at `http://localhost:5000`.

### 4. Open Frontend

Simply open `frontend/index.html` in your browser:

```bash
# Option 1: Direct open
start frontend/index.html

# Option 2: Use a simple HTTP server (recommended)
cd frontend
npx -y serve .
```

Frontend will be served at `http://localhost:3000` (with serve) or just open the HTML file directly.

---

## 📋 Project Structure

```
SPORTS/
├── backend/
│   ├── server.js          # Full Express API (single file)
│   ├── package.json       # Node dependencies
│   └── .env               # Environment variables
├── frontend/
│   └── index.html         # Full React app (single file)
├── database/
│   └── schema.sql         # PostgreSQL schema
└── README.md
```

---

## ⚙️ Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React 18, TailwindCSS (CDN)   |
| Backend    | Node.js, Express              |
| Database   | PostgreSQL                    |
| Auth       | JWT (jsonwebtoken + bcryptjs) |
| DB Client  | pg (node-postgres)            |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint         | Description          | Auth |
|--------|------------------|----------------------|------|
| POST   | /auth/register   | Register new user    | No   |
| POST   | /auth/login      | Login user           | No   |
| GET    | /auth/me         | Get current user     | Yes  |

### Arenas
| Method | Endpoint         | Description          | Auth     |
|--------|------------------|----------------------|----------|
| GET    | /arenas          | List all arenas      | No       |
| GET    | /arenas/:id      | Get arena details    | No       |
| POST   | /arenas          | Create arena         | Business |
| PUT    | /arenas/:id      | Update arena         | Business |
| DELETE | /arenas/:id      | Delete arena         | Business |
| GET    | /arenas/my/list  | My arenas            | Business |

### Slots
| Method | Endpoint         | Description          | Auth     |
|--------|------------------|----------------------|----------|
| GET    | /slots/:arenaId  | Get arena slots      | No       |
| POST   | /slots           | Create slot          | Business |
| POST   | /slots/bulk      | Bulk create slots    | Business |
| PUT    | /slots/:id       | Toggle availability  | Business |
| DELETE | /slots/:id       | Delete slot          | Business |

### Bookings
| Method | Endpoint                  | Description          | Auth     |
|--------|---------------------------|----------------------|----------|
| POST   | /bookings                 | Create booking       | Customer |
| POST   | /bookings/:id/pay         | Process payment      | Customer |
| GET    | /bookings/my              | My bookings          | Yes      |
| GET    | /bookings/arena/:arenaId  | Arena bookings       | Business |

### Dashboard
| Method | Endpoint          | Description          | Auth     |
|--------|-------------------|----------------------|----------|
| GET    | /dashboard/stats  | Business stats       | Business |

---

## 🎯 Features

### Customer Portal
- ✅ Register/Login
- ✅ Browse arenas with filters (sport, location, price)
- ✅ Arena detail page with available slots
- ✅ Book a slot
- ✅ Mock payment (Card/UPI/Wallet)
- ✅ View booking history

### Business Portal
- ✅ Register/Login
- ✅ Create & manage arenas
- ✅ Add/manage time slots (single + bulk)
- ✅ View bookings per arena
- ✅ Revenue dashboard with stats

---

## 🔐 Auth Flow

1. User registers with role (`business` or `customer`)
2. JWT token returned and stored in `localStorage`
3. Token sent as `Authorization: Bearer <token>` header
4. Role-based access control on backend routes

---

## 💳 Payment (Mock)

- Simulates 90% success / 10% failure rate
- Supports Card, UPI, and Wallet UI
- Stores payment status in database
- Generates mock transaction IDs

---

## 🚀 Deployment

### Backend (Render / Railway)
1. Push `backend/` to a Git repo
2. Set environment variables:
   - `DATABASE_URL` — Your PostgreSQL connection string
   - `JWT_SECRET` — A secure random string
   - `FRONTEND_URL` — Your frontend URL (for CORS)
   - `PORT` — Usually auto-set by platform
3. Start command: `npm start`

### Frontend (Netlify / Vercel)
1. Push `frontend/` to a Git repo
2. Set build output to `frontend/`
3. Update `API` constant in `index.html` to your backend URL

### Database
- Use a managed PostgreSQL service (Supabase, Neon, Railway, etc.)
- Run `schema.sql` to initialize tables

---

## 🔧 Environment Variables

| Variable      | Description                | Default                                                    |
|---------------|----------------------------|------------------------------------------------------------|
| DATABASE_URL  | PostgreSQL connection      | postgresql://sportarena:sportarena123@localhost:5432/sportarena |
| JWT_SECRET    | JWT signing secret         | sportarena_secret_key_2024                                 |
| PORT          | Server port                | 5000                                                       |
| FRONTEND_URL  | Frontend URL for CORS      | http://localhost:3000                                      |

---

## 📝 License

MIT — Build something awesome! 🏟️
