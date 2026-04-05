# Finance Data Processing and Access Control Backend

This backend is aligned to the assignment for **Finance Data Processing and Access Control Backend** and is implemented with Node.js, Express, MongoDB, JWT auth, role-based access control, analytics aggregation, and GraphQL.

## Tech Stack
- Runtime: Node.js + TypeScript
- Framework: Express 5
- Database: MongoDB (Mongoose)
- Auth: JWT Bearer tokens
- Validation: Zod
- Security: Helmet, CORS policy, API/login rate limiting
- Tests: Vitest + Supertest + mongodb-memory-server
- CI: GitHub Actions type-check + tests

## Requirement Mapping

### 1) User and Role Management
Implemented with `User` model and role/status fields (`admin`, `analyst`, `viewer`; `active`, `inactive`).

Endpoints:
- `POST /api/users/create` (admin)
- `GET /api/users` (admin)
- `PATCH /api/users/manage/:id` (admin)
- `DELETE /api/users/manage/:id` (admin)
- `GET /api/users/search` (admin/analyst)

Role middleware:
- `protect` + `checkRole(...)` in route layer.

### 2) Financial Records Management
CRUD with filter support (date/category/type/payment method/user scope).

Endpoints:
- `POST /api/users/finance/create` (admin)
- `GET /api/users/finance` (admin/analyst)
- `GET /api/users/finance/my` (authenticated)
- `PUT /api/users/finance/:id` (admin)
- `DELETE /api/users/finance/:id` (admin)

Pagination + sorting:
- `page`, `limit`, `sortBy`, `sortOrder` on `GET /api/users/finance`.

### 3) Dashboard Summary APIs
Aggregations include:
- Total income/expense/net
- Average/min/max amount
- Category totals
- Monthly trends
- Recent activity
- Top/lowest spenders
- User-wise breakdown (name/email + totals)

Endpoint:
- `GET /api/users/finance/analytics`

### 4) Access Control Logic
- Viewer: read-only dashboard analytics
- Analyst: read finance/analytics by approved scope
- Admin: full user + finance + permission management

Permission workflow endpoints:
- `POST /api/users/permissions/request`
- `GET /api/users/permissions/my`
- `GET /api/users/permissions/requests`
- `PATCH /api/users/permissions/requests/:id`
- `DELETE /api/users/permissions/requests/:id`

### 5) Validation and Error Handling
Validation:
- Centralized request validation with Zod middleware (`src/middleware/validate.ts`).

Error handling:
- Centralized `notFoundHandler` + `errorHandler` with standard shape:
  - `{ success: false, error: { code, message } }`

### 6) Data Persistence
MongoDB via Mongoose (`src/config/db.ts`) with persistent collections for users, finance records, permissions, and audit logs.

## Optional Enhancements Implemented
- JWT authentication (`/api/users/login`, `/api/users/register`)
- Search support (`/api/users/search`)
- Pagination + sorting (`/api/users/finance`)
- GraphQL endpoint (`POST /api/graphql`)
- Automated tests (`tests/api.test.ts`)
- Security hardening (helmet, rate limiting, controlled CORS)
- Audit trail for critical actions (`AuditLog` model)

## GraphQL
Protected endpoint:
- `POST /api/graphql` (requires Bearer token)

Sample query:
```graphql
query {
  dashboardSummary {
    totalIncome
    totalExpense
    netBalance
    averageAmount
    minAmount
    maxAmount
  }
}
```

## Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables
See `.env.example`:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `RATE_LIMIT_MAX`
- `LOGIN_RATE_LIMIT_MAX`

## Testing
```bash
npm run test
npm run typecheck
```

## Assumptions / Tradeoffs
- Admin can create finance records for any user.
- Analyst access is controlled through explicit permission requests.
- Pagination response is returned when `page` or `limit` is provided; otherwise legacy array response is preserved for compatibility.
- Audit trail captures create/update/delete/review events for user, finance, and permissions.

## Deployment Notes
- Use production MongoDB URI and strong `JWT_SECRET`.
- Set strict `CORS_ORIGIN` to trusted frontend domains only.
- Keep rate limits enabled behind a reverse proxy/load balancer.
- Run `npm run typecheck && npm run test` in CI before deployment.
