# SmartStayX

A full-stack luxury hotel booking platform with an owner dashboard for managing properties, rooms, bookings, payments, and staff.

## Tech Stack

**Frontend** — React 19, Vite, Tailwind CSS, Framer Motion, React Router, Recharts, Clerk Auth, Vitest  
**Backend** — Node.js, Express, MongoDB (Mongoose), Stripe, Redis, Cloudinary, Zod validation  
**AI Service** — Python (FastAPI), OpenAI/OpenRouter, LangChain  
**Auth** — Clerk (JWT + webhooks)

## Project Structure

```
SmartStayX/
├── Server/                      # Express backend
│   ├── controllers/             # Route handlers
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express routers
│   ├── services/                # Business logic (pricing, bookings, rooms, analytics, chatbot)
│   ├── middleware/               # Auth, authorization, validation, error handling, upload
│   ├── validators/              # Zod schemas for request validation
│   ├── configs/                 # DB, Cloudinary, runtime config
│   ├── utils/                   # Stripe, Redis, logger, API response helpers, booking cleaner
│   └── server.js                # Entry point
├── client/                      # React frontend
│   └── src/
│       ├── components/          # Shared UI components (Hero, StarRating, ErrorBoundary, etc.)
│       ├── hotelOwner/          # Owner dashboard pages and components
│       ├── receptionist/        # Receptionist pages and components
│       ├── pages/               # Public pages (Home, AllRooms, RoomDetails, MyBookings)
│       ├── services/            # API service layer (BookingService, ChatService)
│       ├── context/             # React context (AppContext, ChatContext)
│       ├── config/              # API endpoints and app configuration
│       ├── constants/           # Enums and static data
│       ├── hooks/               # Custom React hooks
│       ├── locales/             # i18n translations
│       ├── chatbot/             # Chatbot UI components
│       └── test/                # Vitest test files
├── ai-service/                  # Python AI microservice (FastAPI)
│   └── app/
│       ├── routers/             # Chat, health, trip planner endpoints
│       ├── services/            # LLM, context, recommendation services
│       ├── models/              # Chat and trip MongoDB models
│       └── utils/               # Tools and prompts
├── ml-service/                  # Machine learning microservice
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
ADMIN_EMAILS=admin@smartstayx.com,owner@smartstayx.com
ADMIN_DASHBOARD_ACCESS=owner
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
```

**AI Service** — copy `ai-service/.env.example` to `ai-service/.env`:

```
MONGODB_URI=mongodb://localhost:27017/SmartStayX
OPENAI_API_KEY=
AI_MODEL=openai/gpt-4o-mini
AI_HOST=127.0.0.1
AI_PORT=8001
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

# AI Service
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# ML Service
cd ml-service
python app.py
```

Note: Gunicorn is recommended on Linux/macOS. On Windows, use `python app.py` because Gunicorn depends on Unix-only modules.

### Run Tests

```bash
cd client
npm test          # Run once
npm run test:watch   # Watch mode
npm run test:coverage  # With coverage report
```

## Testing

Unit and contract tests across several test files covering:
- **Components** — StarRating, ErrorBoundary, Title, RoomDetails, MyBookings
- **Services** — BookingService (all methods, with contract verification)
- **Constants** — bookingStatuses
- **Utilities** — helpers, constants

## Security

- All MongoDB queries sanitized against NoSQL injection (`mongoose.Types.ObjectId.isValid()`)
- Rate limiting on notification endpoints (100 req / 15 min) and global limiter (200 req/min)
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
| `GET /api/rooms/trending/list` | Get trending rooms |
| `GET /api/rooms/:id` | Get room by ID |
| `POST /api/bookings/book` | Create booking |
| `POST /api/bookings/check-availability` | Check room availability |
| `POST /api/bookings/calculate-price` | Get dynamic price quote |
| `POST /api/bookings/cancel` | Cancel booking |
| `POST /api/bookings/modify` | Modify booking dates/guests |
| `POST /api/bookings/pay` | Mark booking as paid |
| `POST /api/bookings/payment-method` | Set payment method |
| `POST /api/bookings/create-checkout-session` | Stripe checkout session |
| `POST /api/bookings/confirm-checkout-session` | Confirm Stripe payment |
| `POST /api/bookings/stripe-webhook` | Stripe webhook |
| `GET /api/bookings/user` | Get user bookings |
| `GET /api/bookings/hotel?hotelId=` | Get hotel bookings (owner dashboard) |
| `POST /api/bookings/owner/update-payment` | Owner updates payment status |
| `PATCH /api/bookings/owner/:bookingId/status` | Owner updates booking status |
| `DELETE /api/bookings/owner/:bookingId` | Owner deletes booking |
| `POST /api/bookings/refund-request` | Request refund |
| `POST /api/bookings/handle-refund` | Owner approves/denies refund |
| `POST /api/offers` | Create offer |
| `GET /api/offers` | List active offers |
| `GET /api/offers/owner` | Get owner offers |
| `PUT /api/offers/:id` | Update offer |
| `DELETE /api/offers/:id` | Delete offer |
| `POST /api/services/request` | Request service |
| `GET /api/services/history` | Hotel service history |
| `GET /api/reviews/room/:roomId` | Get room reviews |
| `GET /api/reviews/owner` | Get owner reviews |
| `GET /api/notifications` | Get notifications (paginated) |
| `PUT /api/notifications/:notificationId/read` | Mark as read |
| `PUT /api/notifications/read-all` | Mark all as read |
| `GET /api/recommendations/user` | Get user recommendations |
| `POST /api/checkin` | Initiate check-in |
| `POST /api/checkin/verify` | Verify check-in code |
| `POST /api/checkin/submit` | Complete check-in |
| `GET /api/invoice/booking/:bookingId` | Get invoice |
| `GET /api/invoice/booking/:bookingId/download` | Download invoice PDF |
| `POST /api/payments/create` | Create payment |
| `POST /api/payments/paypal/capture` | Capture PayPal payment |
| `GET /api/analytics/booking-trends` | Booking trends |
| `GET /api/analytics/revenue` | Revenue analytics |
| `GET /api/analytics/demographics` | Guest demographics |
| `GET /api/pricing/suggest` | Get pricing suggestions |
| `GET /api/pricing/enhanced` | ML-enhanced pricing |
| `POST /api/guest-assistant/chat` | Guest assistant message (Express proxies to the AI service) |
| `POST /api/chat/message` | AI service: send a concierge message (returns full reply) |
| `POST /api/chat/message/stream` | AI service: stream a concierge reply (SSE) |
| `GET /api/chat/conversations` | AI service: list a user's conversations |
| `POST /api/activities/book` | Book an activity |
| `POST /api/destinations` | Create destination |
| `GET /api/destinations` | List destinations |
| `POST /api/receptionist/reservations` | Receptionist reservation actions |
| `GET /api/receptionist/rooms` | Receptionist room listing |
| `POST /api/orgs` | Organization CRUD |
| `POST /api/roles` | Role management |

## Architecture Notes

- Public guest routes are rendered from the React client and mostly read from the Node API.
- Owner and receptionist dashboards are separate route groups in the client and rely on auth-protected backend endpoints.
- Booking, hotel, room, payment, analytics, and notification data are owned by the Express API and MongoDB.
- Conversational AI and trip planning are handled by the FastAPI microservice.
- Price prediction is handled by the Flask ML service.
- The Node server can launch all three backend processes together through `npm run server`.
