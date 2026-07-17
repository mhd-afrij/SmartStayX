# SmartStayX Client

React frontend for the SmartStayX luxury hotel booking platform.

## Tech Stack

React 19, Vite, Tailwind CSS, Framer Motion, React Router, Recharts, Clerk Auth, Vitest

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage report
```

## Environment Variables

Set these in `client/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Backend API base URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_DEFAULT_LANGUAGE` | Default UI language (en) |
| `VITE_DEFAULT_CURRENCY` | Default currency (USD) |
| `VITE_PLATFORM_EMAIL` | Platform contact email |
| `VITE_OWNER_OVERRIDE_EMAIL` | Owner override email |

## Project Structure

```
src/
├── components/       # Shared UI components (barrel exported)
├── hotelOwner/       # Owner dashboard pages and components
├── pages/            # Public pages
├── services/         # API service layer
├── context/          # React context (AppContext)
├── config/           # ConfigManager and app configuration
├── constants/        # Enums, pricing config, static data
├── assets/           # SVGs, icons
└── test/             # Vitest test files
```

## Barrel Imports

Common components are re-exported from `src/components/index.js` for concise imports:

```js
import { Hero, HotelCard, Title, StarRating, ErrorBoundary } from '../components'
```
