# CrossConnect-Phos

CrossConnect-Phos is a modular integration platform for collecting and synchronizing metrics and operational data across multiple marketplaces and warehouses. It consists of:
- A NestJS backend (backend/) that manages connectors, background jobs, webhooks, and persistence.
- A NextJS frontend (frontend/) that provides a multi-channel dashboard and management UI.

This README focuses on developer documentation so you can get the app running locally and understand the core structure.
---

Table of contents
- Overview
- Technology stack
- Architecture (modules & responsibilities)
- Environment variables (required / recommended)
- Local development (quickstart)
  - Backend (NestJS)
  - Frontend (Next.js)
  - Optional: docker-compose example (Redis + Supabase)
- Jobs & background processing (BullMQ)
- Webhooks
- Testing & code generation
- Production build & run
- Troubleshooting
- Contributing

---

Overview
- Purpose: centralize metrics and sync jobs for Amazon, Walmart, Shopify, TikTok, Faire, Target, Warehance and others.
- Repo layout (top-level):
  - backend/ — NestJS service with connectors, jobs, webhooks and Supabase repositories.
  - frontend/ — Next.js app (app directory) containing UI components and pages.
  - .api/ — bundled API/OpenAPI artifacts used by backend and frontend.

Technology stack
- Backend: Node.js + TypeScript + NestJS
  - BullMQ (job queues) with Redis
  - Supabase (database / storage)
  - nestjs-pino for structured logging, optional New Relic enrichment
  - Connectors for marketplaces (Amazon, Walmart, Shopify, TikTok, Faire, Target, Warehance)
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Development: Jest for tests, ESLint + Prettier for linting and formatting

Architecture (high-level)
- AppModule (backend/src/app.module.ts) wires:
  - ConfigModule — environment configuration + validation
  - SupabaseModule — persistent storage
  - BullModule — queue connection to Redis
  - ConnectorsModule — per-platform connector modules
  - JobsModule — processors for products, orders, returns
  - WebhooksModule — incoming webhook handlers (Shopify/TikTok/Walmart)
  - LoggerModule — structured logging
- Jobs:
  - Queues registered: products, orders, returns (backend/src/jobs/jobs.module.ts)
  - TasksService (backend/src/tasks/tasks.service.ts) schedules polling, enqueues jobs, cleans up old jobs
- Repositories (backend/src/supabase/repositories):
  - stores.repository.ts, store_credentials.repository.ts, orders.repository.ts, products.repository.ts, etc. — encapsulate DB access to Supabase tables.
- Frontend:
  - Next.js app directory with (auth) and (dashboard) route groups, UI components for dashboard, integrations, settings, etc.

Environment variables
- Backend (minimum required according to code):
  - SUPABASE_URL — (required) Supabase instance URL
  - SUPABASE_SERVICE_KEY — (required) Supabase service key (server-side only)
  - REDIS_HOST — host for Redis (default: localhost)
  - REDIS_PORT — port for Redis (default: 6379)
  - REDIS_PASSWORD — (optional) Redis password
  - FRONTEND_URL — URL for frontend CORS (default: http://localhost:3000)
  - PORT — backend port (default: 3000)
  - NODE_ENV — environment (development | production)
  - NEW_RELIC_APP_NAME, NEW_RELIC_LICENSE_KEY — (optional) if using New Relic
- Frontend (suggested / common):
  - NEXT_PUBLIC_API_URL — base URL for backend API (e.g., http://localhost:3001/api)
  - NEXT_PUBLIC_SUPABASE_URL — (optional) only if frontend directly calls Supabase
  - NEXT_PUBLIC_SUPABASE_ANON_KEY — (optional) only if frontend directly calls Supabase

Important security note:
- Never expose SUPABASE_SERVICE_KEY or other secret service keys in frontend code or public repos. Use server-side endpoints for privileged calls.

Local development — Quickstart
Prereqs:
- Node.js (16+ or matching workspace), npm
- Redis (for BullMQ)
- Supabase (local via supabase CLI or hosted Supabase project)
- Recommended: pnpm or npm locally per package

1) Clone the repo
```bash
git clone https://github.com/PheonixCodder/CrossConnect-Phos.git
cd CrossConnect-Phos
```

2) Install dependencies
Install for each workspace:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3) Configure environment variables
- Backend example file: create backend/.env (or supply env in your environment)
Example backend/.env:
```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
```

- Frontend example: create frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4) Start required infra
- Start Redis:
  - Locally: install & run redis-server
  - Or via Docker: docker run -p 6379:6379 redis:7
- Start Supabase:
  - Use hosted Supabase and set SUPABASE_URL/SUPABASE_SERVICE_KEY accordingly
  - Or use supabase CLI: supabase start (requires supabase CLI)

5) Run backend and frontend concurrently
```bash
# Backend (in backend/)
npm run start:dev
# -> runs NestJS in watch mode (default port from .env or 3001)

# Frontend (in frontend/)
npm run dev
# -> Next.js dev server (default http://localhost:3000)
```

Notes: The NestJS app sets a global prefix 'api' in main.ts. When calling backend routes from frontend, use NEXT_PUBLIC_API_URL + the route path (or use relative paths /api when hosting together).

Optional docker-compose example (quick local testing)
This is a minimal example — adapt for your environment:

```yaml
version: '3.8'
services:
  redis:
    image: redis:7
    ports:
      - "6379:6379"

  supabase:
    image: supabase/postgres:15.3.0
    environment:
      POSTGRES_PASSWORD: example
    # For a real local supabase use the supabase CLI or full docker-compose recommended by Supabase

  backend:
    build:
      context: ./backend
    working_dir: /app
    volumes:
      - ./backend:/app
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - FRONTEND_URL=http://localhost:3000
    ports:
      - "3001:3001"
    depends_on:
      - redis

  frontend:
    build:
      context: ./frontend
    working_dir: /app
    volumes:
      - ./frontend:/app
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

Jobs & background processing (BullMQ)
- Queues created: products, orders, returns (see backend/src/jobs/jobs.module.ts)
- BullMQ connection configured in AppModule (backend/src/app.module.ts) using REDIS_HOST/REDIS_PORT/REDIS_PASSWORD.
- Task scheduler:
  - backend/src/tasks/tasks.service.ts runs scheduled intervals:
    - Polls active stores and enqueues product/order/return sync jobs.
    - healthCheck() runs every 5 minutes.
    - cleanupOldJobs() runs daily (cleans completed jobs older than 7 days).
- Job options include retries, exponential backoff, and removal policies. Processors for each queue exist under backend/src/jobs (ProductsProcessor, OrdersProcessor, ReturnsProcessor).

Webhooks
- Webhook modules live under backend/src/api/webhooks/connectors/* for Shopify, TikTok, Walmart.
- The NestJS app enables CORS with FRONTEND_URL.
- Webhook controllers and processors:
  - Expect incoming requests at API-prefixed routes handled by the respective connector modules.
  - Stores repository has a webhook status update helper (stores.repository.ts -> updateWebhookStatus).

Testing & code generation
- Backend tests:
  - Run unit tests: from backend/ run:
    ```bash
    npm run test
    ```
  - Run e2e tests:
    ```bash
    npm run test:e2e
    ```
- Lint & format:
  - Backend:
    ```bash
    npm run lint
    npm run format
    ```
  - Frontend:
    ```bash
    npm run lint
    ```
- GraphQL / API codegen:
  - backend/package.json contains `graphql-codegen` script — run in backend/ when working with GraphQL artifacts.

Production build & run
- Backend:
  - Build and copy API artifacts:
    ```bash
    cd backend
    npm run build
    ```
  - Start production:
    ```bash
    npm run start:prod
    ```
- Frontend:
  - Build:
    ```bash
    cd frontend
    npm run build
    npm run start
    ```
- Ensure environment variables for production are correctly set and secrets kept server-side.

API specs & openapi
- API artifacts are present under .api and backend/.api and frontend/.api. The backend build copies the openapi file to dist/.
- Use these specs to generate clients or document endpoints further.

Troubleshooting & tips
- Redis connection errors:
  - Verify REDIS_HOST/REDIS_PORT/REDIS_PASSWORD.
  - Ensure Redis is reachable from the backend container/host.
- Supabase errors:
  - Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set and valid.
  - Use Supabase dashboard to validate table schemas expected by repositories.
- Missing credentials for stores:
  - The TasksService checks for store credentials and logs warnings; ensure `store_credentials` table entries have expected fields.
- Webhook verification:
  - Connectors often validate signatures (see connector webhook guards). Make sure webhook endpoints use the expected secret in store credentials.
- Do not expose service keys in frontend — keep SUPABASE_SERVICE_KEY server-side.

Extending / contributing
- Add a new connector:
  - Create a feature module under backend/src/connectors/ (example modules exist for amazon, shopify, walmart, tiktok, faire, target, warehouse).
  - Implement controller/service/mapper and register in ConnectorsModule.
- Add job processors:
  - Register queue in backend/src/jobs/jobs.module.ts and implement a Processor (e.g., MyPlatformProcessor).
- Follow repository conventions:
  - Tests: add .spec.ts for new modules.
  - Lint/format code: run ESLint & Prettier before PRs.
  - Use graphql-codegen if working with GraphQL artifacts.

Useful commands (summary)
- Backend:
  - Install: cd backend && npm install
  - Dev: npm run start:dev
  - Build: npm run build
  - Prod start: npm run start:prod
  - Tests: npm run test, npm run test:e2e
  - Lint & format: npm run lint, npm run format
- Frontend:
  - Install: cd frontend && npm install
  - Dev: npm run dev
  - Build: npm run build
  - Start (production): npm run start
  - Lint: npm run lint

Where to look next (important source files)
- backend/src/main.ts — application bootstrap, CORS, validation pipes
- backend/src/app.module.ts — overall module wiring
- backend/src/tasks/tasks.service.ts — scheduled polling and enqueuing logic
- backend/src/jobs/ — queue registration and processors
- backend/src/connectors/ — per-platform connectors (shopify, amazon, walmart, tiktok, faire, target, warehance)
- backend/src/supabase/repositories/ — DB access for stores, credentials, alerts
- frontend/app/ — Next.js app routes and layout

Contact / issues
- Open an issue in the repository with logs and steps to reproduce if you hit a blocker.
- Include backend logs (NestJS) and any job queue traces (BullMQ) along with Redis/Supabase health info.

---

Thanks for using CrossConnect-Phos. If you want, I can:
- Add a detailed API reference for the backend endpoints (generate from .api/openapi.json),
- Create a ready-made docker-compose for local dev with Supabase emulation,
- Produce a CONTRIBUTING.md and CODE_OF_CONDUCT file.
