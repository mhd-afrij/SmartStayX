# SmartStayX Architecture

## Services

- `client/` is the React frontend.
- `Server/` is the Express API and main application backend.
- `ai-service/` is the FastAPI service for the AI concierge chat.
- `ml-service/` is the Flask service for price prediction.

## Request Flow

1. The browser loads the React client.
2. The client calls the Express API for core hotel, room, booking, payment, notification, and analytics features.
3. The Express API reads and writes MongoDB and integrates with Stripe, Cloudinary, Clerk, and optional Redis-backed helpers.
4. The guest assistant widget calls the Express API (`/api/guest-assistant/chat`), which proxies to the FastAPI AI service (`/api/chat/message`) and falls back to canned replies if the AI service is unavailable. The AI service shares the same MongoDB database.
5. The client or backend can call the ML service for dynamic pricing predictions.

## Route Ownership

- Guest browsing, booking, and profile flows live in the client and call the Express API.
- Owner dashboard flows live in the client and call owner-protected Express endpoints.
- Receptionist flows live in the client and call receptionist-protected Express endpoints.
- AI concierge chat lives in the FastAPI service, reached through the Express `/api/guest-assistant` proxy.
- Pricing prediction lives in the Flask ML service.

## Startup

- `npm run server` in `Server/` starts the Express API, the FastAPI AI service, and the Flask ML service together.
- The AI service listens on port `8001` by default (overridable via `AI_SERVICE_PORT` / `AI_PORT`).
- The ML service listens on port `5000` by default unless overridden by `ML_SERVICE_PORT`.

## Notes

- The Express API is the system of record for bookings, hotels, rooms, payments, and analytics.
- The README should be kept in sync with route changes because several features are spread across multiple routers.
