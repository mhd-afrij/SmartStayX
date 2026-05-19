# SmartStayX

A full-stack luxury hotel booking platform with an owner dashboard for managing properties, rooms, bookings, and payments.

## Tech Stack

**Frontend** — React 19, Vite, Tailwind CSS, Framer Motion, React Router, Recharts, Clerk Auth  
**Backend** — Node.js, Express, MongoDB (Mongoose), Stripe, Redis, Cloudinary  
**Auth** — Clerk (JWT + webhooks)

## Features

### Guest
- Browse rooms with destination search & filters
- Trip planner with itinerary builder
- Real-time room availability & dynamic pricing
- Stripe checkout or pay-at-hotel
- Booking management (modify, cancel)
- Reviews & chatbot support

### Hotel Owner
- Owner dashboard with KPIs, revenue charts, booking tables
- Hotel registration & profile management
- Room CRUD with image upload
- Offer/promotion management
- Payment & booking management
- Staff & service request management
- Review & testimonial moderation

## Project Structure

```
SmartStayX/
├── Server/                  # Express backend
│   ├── controllers/         # Route handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── services/            # Business logic (pricing, bookings)
│   ├── middleware/           # Auth, upload, validation, error handling
│   ├── validators/          # Zod schemas
│   ├── configs/             # DB, Cloudinary, runtime config
│   ├── utils/               # Stripe, Redis, logger, booking cleaner
│   └── server.js            # Entry point
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Shared UI components
│       ├── hotelOwner/      # Owner dashboard pages & components
│       ├── pages/           # Public pages
│       ├── services/        # API service layer
│       ├── context/         # React context
│       ├── stores/          # Zustand stores
│       ├── config/          # API endpoints & app config
│       ├── constants/       # Enums & static data
│       └── data/            # Static destination data
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB instance
- Stripe account
- Clerk account
- Cloudinary account

### Environment Variables

**Server** — copy `Server/.env.example` to `Server/.env` and fill in:
```
PORT=3000
MONGODB_URI=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_URL=
```

**Client** — create `client/.env`:
```
VITE_BACKEND_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=
```

### Run Locally

```bash
# Backend
cd Server
npm install
npm run server

# Frontend
cd client
npm install
npm run dev
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/hotels` | Register hotel |
| `GET /api/hotels/search` | Search hotels by name/city |
| `GET /api/hotels/owner` | Get owner's hotels |
| `POST /api/rooms` | Add room |
| `GET /api/rooms` | List all rooms |
| `POST /api/bookings/book` | Create booking |
| `POST /api/bookings/create-checkout-session` | Stripe checkout |
| `POST /api/offers` | Create offer |
| `POST /api/services/request` | Request service |
| `GET /api/reviews/room/:roomId` | Get room reviews |
| `POST /api/user/profile` | Update user profile |
| `GET /api/recommendations/user` | Get recommendations |
