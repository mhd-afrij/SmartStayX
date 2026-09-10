# SmartStayX Project Report

**Project Name:** SmartStayX  
**Project Type:** Hotel Management, Booking, AI Concierge, and Dynamic Pricing Platform  
**Architecture:** MERN stack with FastAPI AI service and Flask ML service  
**Report Date:** 2026-09-10

## Executive Summary

SmartStayX is a full-stack hotel management and guest-service platform designed for guests, hotel managers, receptionists, and platform administrators. The system combines hotel discovery, room booking, payments, dashboards, operational workflows, an AI guest assistant, trip planning, and ML-supported dynamic pricing.

The project is organized as a multi-service application:

- `frontend`: React/Vite client for public pages and dashboards.
- `backend`: Express API for business logic, authentication, authorization, persistence, payments, and service orchestration.
- `ai-service`: FastAPI microservice for AI concierge chat, conversation history, recommendation context, and tool execution.
- `ml-service`: Flask microservice for pricing prediction and model training.
- `docs`: Architecture and planning documentation.

The current implementation already includes a broad feature surface: public hotel browsing, booking workflows, role-based dashboards, payments, notifications, service requests, analytics, receptionist operations, security center features, AI guest assistant routes, trip planner routes, and ML pricing support.

## 1. Project Objectives

SmartStayX aims to provide one integrated digital platform for hotel operations and guest engagement.

Main objectives:

- Allow guests to browse hotels and rooms.
- Support booking creation, modification, cancellation, payment, and invoice generation.
- Provide hotel managers with property, room, staff, payment, review, inventory, attendance, loyalty, and analytics management.
- Provide receptionists with front desk, reservation, room status, service, payment, offer, review, and task workflows.
- Provide super admins with platform-level control over users, roles, hotels, approvals, reports, audit logs, security, and settings.
- Provide an AI-powered guest assistant for hotel and booking support.
- Provide trip planning with places search, route calculation, map interaction, and saved trips.
- Provide ML-based pricing assistance for dynamic hotel pricing.

## 2. Technology Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Clerk React SDK
- Axios
- Framer Motion
- Recharts
- Leaflet and React Leaflet
- Lucide React icons
- Vitest and Testing Library

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- Clerk Express SDK
- Stripe
- Cloudinary
- Redis / ioredis
- Helmet
- CORS
- Express rate limiting
- Express Mongo sanitize
- Zod validation
- Winston logging

### AI Service

- Python
- FastAPI
- Uvicorn
- Pydantic / Pydantic Settings
- Motor MongoDB driver
- OpenAI-compatible provider integration
- OpenRouter-compatible base URL
- HTTPX
- SSE Starlette
- Pytest

### ML Service

- Python
- Flask
- Flask-CORS
- Scikit-learn
- Pandas
- NumPy
- Joblib
- Gunicorn for Linux/macOS deployment
- Pytest

## 3. High-Level Architecture

```text
Browser / React Frontend
        |
        v
Express Backend API
        |
        +--> MongoDB
        +--> Clerk Authentication
        +--> Stripe Payments
        +--> Cloudinary Media
        +--> Redis Cache / Locks
        +--> FastAPI AI Service
        +--> Flask ML Service
```

The Express backend is the primary application API and system of record for business data. The AI and ML services are internal supporting services. They should not be called directly from the public frontend in production.

## 4. Service Responsibilities

### 4.1 Frontend

The frontend handles:

- Public guest pages
- Authentication UI integration
- Hotel and room browsing
- Booking wizard
- Payment page
- User profile and bookings
- Blog and about pages
- Trip planner UI
- Guest assistant widget
- Hotel manager dashboard
- Receptionist dashboard
- Super admin dashboard
- Theme, currency, and language selection

Key public routes include:

- `/`
- `/rooms`
- `/rooms/:id`
- `/my-bookings`
- `/about`
- `/login/*`
- `/signup/*`
- `/blog`
- `/trip-planner`
- `/payment/:bookingId`
- `/booking/:roomId`
- `/profile`
- `/notifications`
- `/support`
- `/invoice/:bookingId`

Dashboard route groups:

- `/super-admin`
- `/manager`
- `/receptionist`

### 4.2 Backend

The backend handles:

- Authentication and user synchronization through Clerk
- Role-based authorization
- Hotel CRUD
- Room CRUD
- Booking workflows
- Payment integration
- Invoice generation
- Offers
- Reviews
- Notifications
- Guest service requests
- Recommendations
- Check-in workflows
- Analytics
- Pricing integration
- Receptionist workflows
- Organization and role management
- Attendance
- Inventory
- Housekeeping
- Loyalty
- Security center
- Trip planner persistence
- Places, geocoding, and directions proxying
- AI guest assistant proxying

### 4.3 AI Service

The AI service handles:

- Health checks
- Conversation creation
- Conversation listing
- Conversation detail retrieval
- Conversation deletion
- AI message generation
- Streaming chat responses
- Context loading
- Tool execution for hotel and booking data
- IDOR-safe resource access

Important AI routes include:

- `GET /api/health`
- `POST /api/chat/conversations`
- `GET /api/chat/conversations`
- `GET /api/chat/conversations/{conversation_id}`
- `DELETE /api/chat/conversations/{conversation_id}`
- `POST /api/chat/message`
- `POST /api/chat/message/stream`

### 4.4 ML Service

The ML service handles:

- Dynamic pricing model serving
- Price prediction endpoints
- Model training scripts
- Synthetic pricing data generation
- Saved model artifacts
- Pricing metrics metadata

## 5. Core Functional Modules

### 5.1 Authentication and Roles

SmartStayX uses Clerk for authentication. The backend protects sensitive routes and resolves user roles through Clerk claims, Clerk metadata, and stored MongoDB user records.

Supported roles:

- `guest`
- `receptionist`
- `hotel_manager`
- `super_admin`

Role-based behavior:

- Guests can browse, book, pay, view their own bookings, request services, and use guest-facing tools.
- Hotel managers can manage hotels, rooms, staff, pricing, reservations, payments, services, reviews, testimonials, analytics, inventory, housekeeping, attendance, and loyalty features.
- Receptionists can manage front-desk workflows, reservations, room status, tasks, payments, services, offers, and reviews.
- Super admins can manage platform users, roles, hotels, guests, rooms, reservations, reports, settings, approvals, audit logs, and security views.

### 5.2 Hotel Management

Hotel management includes creating, updating, listing, approving, and managing hotel records. Hotel records include core details such as name, city, address, country, amenities, owner, approval status, and location data.

Location data is especially important for trip planning, places discovery, and map-based workflows.

### 5.3 Room Management

Room management supports hotel inventory at room level. Typical room data includes:

- Room number
- Room type
- Hotel reference
- Price per night
- Availability
- Images
- Amenities
- Status

The room module supports both public browsing and manager/receptionist operational views.

### 5.4 Booking System

The booking system supports:

- Booking creation
- Availability checks
- Dynamic price calculation
- Payment flow
- Checkout session creation
- Stripe confirmation
- Cancellation
- Modification
- Refund requests
- Owner payment updates
- Booking status changes
- Guest booking history
- Hotel booking views

The booking system is one of the central business modules and should remain strongly validated and authorization protected.

### 5.5 Payments and Invoices

Payment-related functionality includes:

- Stripe checkout sessions
- Stripe webhook handling
- PayPal capture route support
- Payment status updates
- Invoice lookup
- Invoice download
- Invoice viewing
- Invoice export

Payment and invoice data should be treated as high-risk business data and require strict authorization checks.

### 5.6 Guest Services

Guest service workflows include:

- Service request creation
- Service history
- Receptionist service handling
- Housekeeping and maintenance-related workflows

These features connect guest requests with hotel operations.

### 5.7 Trip Planner

The trip planner supports:

- Map-based route planning
- Default guest start point when no authenticated hotel is available
- Hotel start point when available
- Nearby places by category
- Place search
- Reverse geocoding
- Directions and route polyline rendering
- Stop ordering
- Stop duration selection
- ETA and distance summaries
- Saved trips
- Guest local saved trips through browser storage

The trip planner uses Leaflet and React Leaflet on the frontend and places/directions endpoints on the backend.

### 5.8 AI Guest Assistant

The AI assistant is designed as a concierge layer for guest support. It can answer questions, use contextual data, and support booking or hotel-related queries.

Expected AI tool capabilities include:

- Search hotels
- Check room availability
- Get hotel details
- Get user bookings
- Get booking status
- Create service requests

The backend proxies frontend chat requests to the internal FastAPI service and provides fallback behavior if the AI service is unavailable.

### 5.9 Dynamic Pricing

The dynamic pricing module combines backend pricing logic with an ML service. It supports pricing suggestions, occupancy-based adjustments, forecasts, and ML predictions.

The ML service includes training scripts and model artifacts, which means pricing behavior can evolve as data improves.

### 5.10 Admin and Operational Dashboards

The application provides three main protected dashboard areas:

- Super admin dashboard
- Hotel manager dashboard
- Receptionist dashboard

These dashboards separate platform governance, hotel management, and front-desk execution.

## 6. Data and Database Design

The project uses MongoDB as the main persistence layer. Core model areas include:

- Users
- Hotels
- Rooms
- Bookings
- Payments and refunds
- Reviews
- Offers
- Notifications
- Service requests
- Maintenance reports
- Inventory items
- Suppliers
- Attendance
- Leave requests
- Housekeeping tasks
- Loyalty programs, memberships, and rewards
- Organizations
- Roles
- Audit logs
- Trips
- Transport
- Destinations
- Activity bookings
- Security events
- Webhook logs

Data relationships are mostly document references through Mongoose models. High-risk ownership relationships include users to bookings, users to conversations, users to service requests, hotels to rooms, hotels to bookings, and hotels to trips.

## 7. API Overview

Major backend API areas:

| Area | Purpose |
| --- | --- |
| `/api/auth` | Authentication helpers |
| `/api/user` | User profile and session sync |
| `/api/hotels` | Hotel CRUD and listing |
| `/api/rooms` | Room CRUD, listing, availability-related operations |
| `/api/bookings` | Booking, payment, cancellation, modification, refund workflows |
| `/api/offers` | Offer creation and listing |
| `/api/services` | Guest service requests |
| `/api/recommendations` | Recommendation features |
| `/api/support` | Support tickets/conversations |
| `/api/testimonials` | Testimonials |
| `/api/reviews` | Room and owner reviews |
| `/api/notifications` | Notification listing and read state |
| `/api/places` | Places, geocoding, directions, nearby search |
| `/api/trips` | Trip planner hotel location and saved trips |
| `/api/transport` | Transport-related functionality |
| `/api/destinations` | Destination management |
| `/api/pricing` | Pricing suggestions and ML-enhanced pricing |
| `/api/analytics` | Booking, revenue, and demographic analytics |
| `/api/checkin` | Check-in workflows |
| `/api/invoice` | Invoice generation, view, download, export |
| `/api/payments` | Payment gateway actions |
| `/api/guest-assistant` | Backend proxy for AI guest assistant |
| `/api/receptionist` | Receptionist workflows |
| `/api/maintenance` | Maintenance reporting |
| `/api/refunds` | Refund processing |
| `/api/roles` | Role management |
| `/api/admin` | Admin dashboard operations |
| `/api/orgs` | Organization support |
| `/api/attendance` | Attendance and leave workflows |
| `/api/inventory` | Inventory and supplier management |
| `/api/housekeeping` | Housekeeping tasks |
| `/api/loyalty` | Loyalty program features |
| `/api/security` | Security center features |

## 8. Security Review

Security controls already represented in the architecture include:

- Clerk authentication for protected routes
- Role-based protected routes in the frontend
- Backend authorization middleware
- Internal service token for AI service
- Internal service token for ML service
- MongoDB query sanitization
- Helmet security headers
- CORS configuration
- Rate limiting
- Stripe webhook raw-body handling
- User ownership checks for protected resources
- Audit logs and security events

Important security requirements:

- Guests must never access another user's bookings, conversations, service requests, invoices, or payments.
- Hotel managers should access only their assigned or owned hotel data unless they are super admins.
- Receptionists should access only permitted hotel operations.
- AI service endpoints should remain internal in production.
- ML prediction endpoints should remain protected because they expose business-sensitive pricing intelligence.
- Webhook routes must preserve raw body parsing for signature verification.
- Secrets must never be committed to the repository.

## 9. Testing Status

The project includes tests across frontend, backend, AI service, and ML service.

Frontend tests include:

- Component tests
- Booking service tests
- Booking contract tests
- Trip planner service tests
- Utility tests
- Constants tests

Backend tests include:

- Smoke tests
- Role tests
- Trip planner tests

AI service tests include:

- Health tests
- Auth tests
- IDOR tests
- Tool tests

ML service tests include:

- App tests

Recommended additional tests:

- End-to-end booking flow
- Payment webhook success and failure scenarios
- Manager authorization boundaries
- Receptionist authorization boundaries
- Full guest assistant conversation flow
- Trip planner guest-mode saved trips
- Places API failure fallback
- ML service internal-token enforcement
- Invoice authorization checks

## 10. Deployment View

Recommended production deployment:

```text
Frontend Hosting
      |
Backend API Server
      |
      +-- MongoDB Atlas
      +-- Redis
      +-- Stripe
      +-- Cloudinary
      +-- Clerk
      +-- FastAPI AI Service
      +-- Flask ML Service
```

Deployment requirements:

- Production MongoDB connection string
- Clerk production keys
- Stripe production keys and webhook secret
- Cloudinary production credentials
- Redis URL if caching or locks are enabled
- Google API key for places, geocoding, and directions
- AI provider API key
- AI internal token shared between backend and AI service
- ML internal token shared between backend and ML service
- Correct frontend URL for CORS and redirects
- HTTPS enabled
- Central logging enabled

## 11. Strengths

Project strengths:

- Clear multi-service architecture
- Broad hotel-management feature coverage
- Role-based dashboard separation
- AI and ML services separated from core backend
- Internal service auth model for AI and ML
- Strong business module coverage: hotels, rooms, bookings, payments, services, analytics
- Modern React frontend stack
- Test coverage exists across all major service areas
- Trip planner combines maps, places, routing, and saved trips
- Security center and audit-log concepts are present

## 12. Risks and Gaps

Potential risks:

- Large frontend bundle warnings indicate future code-splitting work may be useful.
- Some README naming refers to older `client/` and `Server/` names while the current repo uses `frontend/` and `backend/`.
- External services such as Clerk, Stripe, Google APIs, Cloudinary, Redis, and AI provider keys are required for complete runtime behavior.
- AI and ML service availability affects advanced features.
- Google Places and Directions features depend on API key setup and quota.
- Authorization must be continuously tested because the app has many roles and resource ownership boundaries.
- Payment and invoice flows need careful production webhook validation.
- Dynamic pricing quality depends on training data quality.

## 13. Recommendations

Short-term recommendations:

- Keep README and architecture docs synchronized with actual folder names and ports.
- Add `.env.example` files for every service if any are missing.
- Add end-to-end tests for booking, payment, and trip planner flows.
- Add tests for guest-mode trip planner local saving.
- Confirm all protected backend routes enforce ownership and role boundaries.
- Confirm AI service cannot be called without `x-internal-token`.
- Confirm ML service cannot be called without `x-internal-token`.
- Document required Google API setup for places and directions.

Medium-term recommendations:

- Split large frontend chunks with route-level and vendor chunking.
- Add centralized API error handling in the frontend service layer.
- Add observability for backend, AI service, and ML service.
- Add health checks for AI and ML dependencies in the backend.
- Add production deployment runbooks.
- Add model evaluation history for dynamic pricing.

Long-term recommendations:

- Improve AI personalization using booking history, hotel context, preferences, and language.
- Add multilingual AI concierge responses.
- Add voice-based guest assistant interaction.
- Add smart itinerary generation connected to trip planner data.
- Add advanced revenue optimization using real booking and occupancy data.
- Add automated customer support triage.

## 14. Conclusion

SmartStayX is a substantial hotel management and guest engagement platform with a strong foundation. The system already covers the major functional needs of a modern hotel platform: guest browsing, bookings, payments, dashboards, operations, analytics, AI assistance, trip planning, and dynamic pricing.

The architecture is suitable for continued development because responsibilities are separated across frontend, backend, AI, and ML services. The most important next steps are tightening documentation, expanding end-to-end tests, hardening authorization boundaries, improving deployment readiness, and adding observability.

Overall, SmartStayX is positioned as a complete hotel operations platform with meaningful AI and ML extensions rather than a simple booking website.
