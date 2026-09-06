# IQ Motor

Iraq's premier motorcycle & bike marketplace. Buy and sell motorcycles, scooters, ATVs, and more across all Iraqi governorates.

## Stack

- **Frontend**: React 19 + Vite, Wouter routing, TanStack Query, Tailwind v4, shadcn/ui, Leaflet maps
- **Backend**: Express 5 API server, Drizzle ORM, PostgreSQL (Replit-managed)
- **Auth**: Clerk (Replit-managed, cookie-based sessions for web)
- **Monorepo**: pnpm workspaces

## Architecture

```
artifacts/
  iq-motor/       — React frontend (preview path: /)
  api-server/     — Express API (port 8080, /api/*)
lib/
  db/             — Drizzle schema + migrations
  api-client-react/ — Generated React Query hooks (Orval)
  api-zod/        — Generated Zod schemas (Orval)
  api-spec/       — OpenAPI spec (openapi.yaml)
```

## Key Routes

### API Endpoints
- `GET /api/vehicles` — paginated listings with filters
- `GET /api/vehicles/featured` — featured listings carousel
- `GET /api/vehicles/latest` — latest listings
- `GET /api/vehicles/:id` — vehicle detail + view increment
- `POST /api/vehicles` — create listing (auth required)
- `GET /api/brands`, `/api/vehicle-types`, `/api/conditions`, `/api/fuel-types`, `/api/transmissions`, `/api/colors`
- `GET /api/regions`, `/api/regions/:id/cities`, `/api/cities`
- `GET /api/dealers`, `/api/dealers/:id`, `/api/dealers/:id/vehicles`
- `GET/POST /api/favorites/:vehicleId` — toggle favorites
- `GET /api/profile`, `PATCH /api/profile`
- `GET /api/messages`, `GET/POST /api/messages/:vehicleId`
- `GET /api/stats/dashboard`, `/api/stats/popular-brands`, `/api/stats/popular-cities`
- `GET /api/admin/*` — admin panel (role=admin required)

### Frontend Pages
- `/` — Home with hero search, stats, featured carousel, latest grid
- `/search` — Browse with sidebar filters
- `/vehicles/:id` — Vehicle detail with gallery, specs, map, seller contact
- `/dealers` — Dealer directory
- `/dealers/:id` — Dealer showroom
- `/create-listing` — 6-step listing wizard (auth required)
- `/profile` — User settings (auth required)
- `/profile/vehicles` — My listings dashboard (auth required)
- `/favorites` — Saved vehicles (auth required)
- `/messages` — Inbox & conversations (auth required)
- `/admin` — Admin dashboard (role=admin required)

## Database Schema

Tables: `users`, `vehicles`, `vehicle_images`, `brands`, `vehicle_models`, `vehicle_types`, `fuel_types`, `transmissions`, `conditions`, `vehicle_colors`, `regions`, `cities`, `favorites`, `messages`, `dealer_profiles`, `vehicle_reports`, `featured_listings`, `exchange_rates`

## Development

```bash
# Start all services
pnpm --filter @workspace/api-server run dev   # API on port 8080
pnpm --filter @workspace/iq-motor run dev      # Frontend (port from env)

# DB operations
pnpm --filter @workspace/db run push           # Push schema changes

# Regenerate API client after openapi.yaml changes
pnpm --filter @workspace/api-client-react run generate
pnpm --filter @workspace/api-zod run generate
```

## Supported Languages
- English (default)
- Arabic (ar)
- Kurdish (ku)

Reference data (vehicle_types, conditions, colors, regions, cities) includes trilingual name columns: `name`, `name_ar`, `name_ku`.

## User Preferences

- Prefer functional, real data over mocks/placeholders
- Backend uses Drizzle ORM (not raw SQL) except for seeding scripts
- Auth is Clerk cookie-based for web — do NOT use Bearer tokens in the browser
- Exchange rate: 1 USD = 1310 IQD (stored in `exchange_rates` table, admin-editable)
