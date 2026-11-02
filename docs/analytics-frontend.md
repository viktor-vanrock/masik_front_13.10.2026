# Frontend analytics integration

## What was added

The frontend now integrates with the backend `AnalyticsModule` and exposes analytics inside the existing protected admin panel.

### Admin dashboard

Open `/admin` as an `ADMIN` or `SUPERUSER` and select the **Analytics / Аналитика** tab.

The dashboard loads:

- `GET /api/analytics/overview` — summary counters and daily series;
- `GET /api/analytics/benchmarks/views` — top benchmark suites/categories;
- `GET /api/analytics/benchmark-tests/views` — top benchmark test cards;
- `GET /api/analytics/events` — the latest raw events.

The UI contains:

- date presets for 7, 30, and 90 days;
- custom `from` / `to` date inputs;
- manual refresh;
- total views, card views, category views, unique sessions, searches, and filter usage counters;
- a Recharts activity chart grouped by day and event type;
- top categories and top benchmark cards;
- latest events with event-type filtering;
- loading, empty, invalid-date, and API-error states;
- Russian and English labels;
- light and dark theme support through existing CSS variables.

### Public tracking

The frontend sends best-effort events to public backend endpoints:

- benchmark detail opened → `POST /api/analytics/benchmark-views` with `benchmarkId` and `benchmarkTestId`;
- catalogue search (two or more characters, after debounce) → `POST /api/analytics/catalog-events` with `catalog_search`;
- active catalogue filters (after debounce) → `POST /api/analytics/catalog-events` with `filter_usage`.

Tracking errors are intentionally swallowed: analytics must not block catalogue rendering, navigation, search, or filtering.

### Anonymous session

A random anonymous session id is generated once and stored in `localStorage` under:

```text
benchmark-catalog.analytics.session-id
```

The backend stores only its SHA-256 hash. No username, email, token, or other personal data is placed into analytics metadata.

A five-second `sessionStorage` deduplication window protects benchmark views from duplicate React StrictMode effects during local development while still allowing later revisits to count.

## Files and responsibilities

- `src/api/analytics/types.ts` — backend contract types and event constants;
- `src/api/analytics/requests.ts` — analytics HTTP requests;
- `src/api/analytics/queries.ts` — TanStack Query hooks for the admin dashboard;
- `src/api/analytics/tracking.ts` — anonymous session and public tracking hooks;
- `src/pages/AdminPanel/ui/analytics/*` — dashboard UI and chart/table helpers;
- `src/pages/BenchmarksCatalogue/index.tsx` — catalogue search/filter tracking;
- `src/pages/BenchmarkDetail/index.tsx` — benchmark-card view tracking;
- `src/i18n/index.ts` — RU/EN analytics translations;
- `src/api/endpoints.ts` — analytics endpoint map.

## Prerequisites

The backend analytics patch must already be applied and its Prisma migration must be deployed.

For local development the default setup is:

```env
VITE_API_BASE_URL=/api
DEV_PROXY_PREFIX=/api
DEV_PROXY_TARGET=http://localhost:3000
```

Start backend on port `3000` and frontend on its Vite port.

## Automated checks

Install dependencies and run:

```bash
npm ci
npm run test
npm run lint
npm run build
```

New tests cover:

- correct analytics endpoint URLs and request payloads;
- anonymous session id persistence;
- filtering of catalogue query fields before tracking;
- benchmark-view duplicate suppression;
- debounced search and filter events;
- inclusive date ranges;
- daily chart aggregation and zero-filled missing days;
- event hash shortening.

## Manual test scenario

1. Start the backend with the analytics migration applied.
2. Start the frontend with `npm run dev`.
3. Open the catalogue in an anonymous browser window.
4. Enter a search string with at least two characters and pause for about one second.
5. Apply one or more catalogue filters and pause again.
6. Open a benchmark card.
7. Log in as an `ADMIN` or `SUPERUSER`.
8. Open `/admin` and select the analytics tab.
9. Select **Last 7 days** and press **Refresh**.
10. Verify that:
    - card views increased;
    - search and filter counters increased;
    - the daily chart contains corresponding series values;
    - the opened benchmark appears in the popular benchmark list;
    - recent events show `Card view`, `Search`, and `Filters` rows.
11. Change the recent-event type selector and verify that the table is filtered.
12. Switch light/dark theme and RU/EN language and verify the dashboard remains readable.

## Browser network checks

In DevTools → Network, filter by `analytics` and verify these requests:

```text
POST /api/analytics/benchmark-views
POST /api/analytics/catalog-events
GET  /api/analytics/overview
GET  /api/analytics/benchmarks/views
GET  /api/analytics/benchmark-tests/views
GET  /api/analytics/events
```

Admin `GET` requests must contain `Authorization: Bearer <token>`. Public tracking requests work without authentication.

## Expected edge cases

- If analytics backend is down, catalogue UX continues to work; only the admin dashboard displays an error state.
- Empty periods show zero counters and empty-state ranking/event blocks.
- An invalid custom range does not send dashboard requests.
- A non-admin user cannot access `/admin` because the existing `AdminGuard` remains in force.
