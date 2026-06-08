Components folder — Barrel export usage

Summary
- This folder provides a single entry (`index.js`) that re-exports commonly used components (a "barrel"). Importing from this barrel keeps import paths concise and centralizes exports for easier refactors.

Recommended usage
- Import common components from the folder root:

  import { Hero, HotelCard, Title } from '.../client/src/components'

- Prefer the barrel for application-level imports. Use direct file imports for deep imports where tree-shaking or code-splitting is necessary.

Caveats & best practices
- Avoid creating circular dependencies between component files and the barrel — keep the barrel as a simple re-export file.
- Keep the barrel minimal; re-export only stable, public components used across the app.
- If a component is large or infrequently used, consider a direct dynamic import with `React.lazy()` instead of exposing it through the barrel.
- Ensure filenames and nested folder exports are consistent. There are duplicated components (top-level and `layout/` or `cards/`) — prefer the canonical locations (`layout/` and `cards/`) and update exports accordingly.

Examples
- Barrel import (preferred):

  import { Hero, FeaturedDestination } from '../../components'

- Direct import (for specific heavy modules):

  const Testimonial = React.lazy(() => import('../../components/cards/Testimonial'))

Questions
- Want me to convert repo imports to the barrel now, or add lint rules to enforce barrel usage?
