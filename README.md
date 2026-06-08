# SmartStayX

A full-stack luxury hotel booking platform with an owner dashboard for managing properties, rooms, bookings, payments, and staff.

## Tech Stack

**Frontend** — React 19, Vite, Tailwind CSS, Framer Motion, React Router, Recharts, Clerk Auth, Vitest  
**Backend** — Node.js, Express, MongoDB (Mongoose), Stripe, Redis, Cloudinary, Zod validation  
**Auth** — Clerk (JWT + webhooks)

## Features

### Guest
- Browse rooms with destination search, filters, star ratings, and pagination
- Dynamic pricing with seasonal, occupancy, last-minute, and length-of-stay adjustments
- Trip planner with Google Places API itinerary builder
- Stripe checkout or pay-at-hotel
- Booking management (create, modify, cancel)
- AI-powered chatbot with booking context
- Room reviews and ratings
- Multi-language and multi-currency support

### Hotel Owner
- Dashboard with KPIs, revenue charts, booking tables, and trend graphs
- Hotel registration and profile management
- Room CRUD with Cloudinary image upload
- Offer and promotion management
- Payment and booking management
- Staff and service request management
- Review and testimonial moderation
- Notification center with real-time updates

## Project Structure

```
SmartStayX/
├── Server/                      # Express backend
│   ├── controllers/             # Route handlers
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express routers
│   ├── services/                # Business logic (pricing, bookings, rooms)
│   ├── middleware/               # Auth, upload, validation, error handling
│   ├── validators/              # Zod schemas for request validation
│   ├── configs/                 # DB, Cloudinary, runtime config
│   ├── utils/                   # Stripe, Redis, logger, sanitize, cleaner
│   └── server.js                # Entry point
├── client/                      # React frontend
│   └── src/
│       ├── components/          # Shared UI components (Hero, StarRating, ErrorBoundary, etc.)
│       ├── hotelOwner/          # Owner dashboard pages and components
│       ├── pages/               # Public pages (Home, AllRooms, RoomDetails, MyBookings)
│       ├── services/            # API service layer (BookingService, ChatService)
│       ├── context/             # React context (AppContext)
│       ├── config/              # API endpoints and app configuration (ConfigManager)
│       ├── constants/           # Enums, pricing config, and static data
│       ├── assets/              # SVGs, icons, and static assets
│       └── test/                # Vitest test files (components, services, config, constants)
└── .github/
    └── workflows/               # CI pipeline (test, build)
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB instance
- Stripe account
- Clerk account
- Cloudinary account
- Redis (optional — for caching and booking locks)

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
GOOGLE_API_KEY=
FRONTEND_URL=http://localhost:5173
```

**Client** — create `client/.env`:

```
VITE_BACKEND_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=
VITE_DEFAULT_LANGUAGE=en
VITE_DEFAULT_CURRENCY=USD
VITE_PLATFORM_EMAIL=contact@smartstayx.com
VITE_OWNER_OVERRIDE_EMAIL=owner@smartstayx.com
VITE_SUPPORT_EMAIL=support@smartstayx.com
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

### Run Tests

```bash
cd client
npm test          # Run once
npm run test:watch   # Watch mode
npm run test:coverage  # With coverage report
```

## Testing

81 tests across 9 test files covering:
- **Components** — StarRating, ErrorBoundary, Title, RoomDetails pages, MyBookings pages
- **Services** — BookingService (all 12 methods)
- **Config** — ConfigManager, pricingConfig
- **Constants** — bookingStatuses, pricingConfig
- **Utilities** — helpers, constants

## Security

- All MongoDB queries sanitized against NoSQL injection (`mongoose.Types.ObjectId.isValid()`)
- Rate limiting on notification endpoints (100 req / 15 min)
- Image URLs validated for safe schemes (`http`, `blob:`) before rendering
- Polynomial regex patterns bounded to prevent ReDoS
- Error messages sanitized to prevent information disclosure
- CI workflow scoped with minimal permissions (`contents: read, pull-requests: read`)

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/hotels` | Register hotel |
| `GET /api/hotels/search` | Search hotels by name/city |
| `GET /api/hotels/owner` | Get owner's hotels |
| `GET /api/hotels/:id` | Get hotel by ID |
| `POST /api/rooms` | Add room (owner) |
| `GET /api/rooms` | List rooms (paginated) |
| `GET /api/rooms/Owner` | Get owner's rooms |
| `GET /api/rooms/trending` | Get trending rooms |
| `GET /api/rooms/:id` | Get room by ID |
| `POST /api/bookings/book` | Create booking |
| `POST /api/bookings/check-availability` | Check room availability |
| `POST /api/bookings/calculate-price` | Get dynamic price quote |
| `POST /api/bookings/cancel` | Cancel booking |
| `POST /api/bookings/modify` | Modify booking dates/guests |
| `POST /api/bookings/pay` | Mark booking as paid |
| `POST /api/bookings/create-checkout-session` | Stripe checkout session |
| `POST /api/bookings/confirm-checkout-session` | Confirm Stripe payment |
| `POST /api/bookings/set-payment-method` | Set payment method |
| `POST /api/bookings/webhook` | Stripe webhook |
| `GET /api/bookings/user` | Get user bookings |
| `GET /api/bookings/owner` | Get hotel bookings (owner dashboard) |
| `POST /api/bookings/owner/update-payment` | Owner updates payment status |
| `DELETE /api/bookings/owner/:bookingId` | Owner deletes booking |
| `GET /api/bookings/owner/:bookingId` | Owner views booking |
| `POST /api/offers` | Create offer |
| `GET /api/offers` | List active offers |
| `GET /api/offers/owner` | Get owner offers |
| `PUT /api/offers/:id` | Update offer |
| `DELETE /api/offers/:id` | Delete offer |
| `POST /api/services/request` | Request service |
| `POST /api/services/update-status` | Update service status |
| `GET /api/services/history` | Hotel service history |
| `GET /api/services/staff` | List staff |
| `POST /api/services/staff` | Add staff |
| `PUT /api/services/staff/:id` | Update staff |
| `DELETE /api/services/staff/:id` | Delete staff |
| `POST /api/services/staff/toggle-availability` | Toggle staff availability |
| `GET /api/services/stats` | Service statistics |
| `GET /api/reviews/room/:roomId` | Get room reviews |
| `POST /api/chat/send` | Chat message |
| `GET /api/chat/history` | Chat history |
| `POST /api/support/conversation` | Create support conversation |
| `GET /api/support/conversations` | Get user conversations |
| `POST /api/support/send` | Send support message |
| `PUT /api/support/status` | Update conversation status |
| `GET /api/notifications` | Get notifications (paginated) |
| `PUT /api/notifications/:notificationId/read` | Mark as read |
| `PUT /api/notifications/read-all` | Mark all as read |
| `GET /api/places/attractions` | Get nearby attractions |
| `GET /api/places/restaurants` | Get nearby restaurants |
| `GET /api/places/route` | Get directions |
| `GET /api/places/itinerary` | Get trip itinerary |
| `POST /api/places/itinerary/item` | Add itinerary item |
| `GET /api/offers` | List active offers |
| `GET /api/recommendations/user` | Get recommendations |
