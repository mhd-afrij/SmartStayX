# Components

Shared React components used across the SmartStayX app.

## Barrel Export

Import common components concisely via the barrel (`index.js`):

```js
import { Hero, HotelCard, Title, StarRating, ErrorBoundary } from '../components'
```

## Guidelines

- Components in this folder are shared across multiple pages.
- Page-specific components live in `src/pages/` or `src/hotelOwner/`.
- Prefer the barrel for application-level imports; use direct imports for lazy-loaded components.
- Keep the barrel minimal — re-export only stable, public components.
- Avoid circular dependencies between components and the barrel.
