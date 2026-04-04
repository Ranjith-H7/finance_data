# Finance Frontend

React + TypeScript frontend for the finance dashboard backend.

## Features

- JWT login and localStorage session handling
- Role-based routes for `admin`, `analyst`, and `viewer`
- Dashboard analytics with summary cards and charts
- Finance CRUD for admin and analyst
- Admin-only user management
- Modern dark UI with Tailwind CSS

## Role Access

- `admin`: dashboard, finance, user management
- `analyst`: dashboard and finance management
- `viewer`: dashboard and read-only finance access

## Backend API Base

Set `VITE_API_URL=http://localhost:3000/api` in `.env`

## Run

```bash
npm install
npm run dev
```

## Notes

This frontend is wired to the backend routes currently present in the backend project:

- `POST /api/users/login`
- `POST /api/users/create`
- `GET /api/users`
- `PATCH /api/users/manage/:id`
- `POST /api/users/finance/create`
- `GET /api/users/finance`
- `GET /api/users/finance/my`
- `GET /api/users/finance/analytics`
- `PUT /api/users/finance/:id`
- `DELETE /api/users/finance/:id`
