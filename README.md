# Finance Data Management System

## 📌 Project Overview

This project is a **Finance Record Management System** built based on real-world company workflow.

In a typical company:

* Developers build and maintain the system
* Admin manages users and data
* Analyst studies the data
* Client/User only views results

This project follows the same idea with three roles:
👉 **Admin** | 👉 **Analyst** | 👉 **Viewer**

---

## 🔐 Authentication & Important Note

* Login and registration are available
* New users are registered as **Viewer by default**
* ⚠️ Password recovery is NOT implemented (no OTP/email system)
* So **do not forget your password**

You can use provided Admin/Analyst credentials to test full features.

Authentication and role-based access are handled using **JWT (JSON Web Token)**.

---

## 👥 Roles & Permissions

### 👑 Admin (Full Control)

* Create users (Admin, Analyst, Viewer)
* Manage users (update/delete)
* Add, update, delete financial records
* Access all users' data
* Approve or revoke Analyst permissions

### 📊 Analyst

* Request access to financial data
* Analyze data (after admin approval)
* View individual or all user data
* Use dashboard (filters, charts, trends)

### 👁️ Viewer

* View only dashboard summary
* Cannot access detailed records
* Cannot modify anything

---

## ⚙️ Tech Stack

**Frontend**

* React 18 + TypeScript
* Vite
* Tailwind CSS
* Axios

**Backend**

* Node.js + Express 5
* TypeScript
* MongoDB + Mongoose
* JWT Authentication
* Zod Validation

**API**

* REST APIs
* GraphQL (Apollo Server)

**Testing/Tools**

* Vitest
* Supertest
* mongodb-memory-server

---

## 🔗 API Endpoints

| Frontend Call (/api/...)        | Backend URL (localhost:3000)               |
| ------------------------------- | ------------------------------------------ |
| /health                         | GET /health                                |
| /users/login                    | POST /api/users/login                      |
| /users/register                 | POST /api/users/register                   |
| /users/create                   | POST /api/users/create                     |
| /users                          | GET /api/users                             |
| /users/search?q=                | GET /api/users/search                      |
| /users/manage/:id               | PATCH /api/users/manage/:id                |
| /users/manage/:id               | DELETE /api/users/manage/:id               |
| /users/finance/create           | POST /api/users/finance/create             |
| /users/finance                  | GET /api/users/finance                     |
| /users/finance/analytics        | GET /api/users/finance/analytics           |
| /users/finance/my               | GET /api/users/finance/my                  |
| /users/finance/:id              | PUT /api/users/finance/:id                 |
| /users/finance/:id              | DELETE /api/users/finance/:id              |
| /users/permissions/request      | POST /api/users/permissions/request        |
| /users/permissions/my           | GET /api/users/permissions/my              |
| /users/permissions/requests     | GET /api/users/permissions/requests        |
| /users/permissions/requests/:id | PATCH /api/users/permissions/requests/:id  |
| /users/permissions/requests/:id | DELETE /api/users/permissions/requests/:id |
| /graphql                        | POST /api/graphql                          |

---

## 🔄 How the System Works (Flow)

**The story begins when a user opens the Finance Dashboard** and registers or logs in.

* The system generates a **secure JWT token**
* Based on role, access is granted:

	* **Admin** → full control
	* **Analyst** → needs permission first
	* **Viewer** → read-only access

Every action from frontend → goes to backend API.

Backend:

* Verifies token
* Checks role
* Validates data
* Reads/writes from MongoDB

Finally:

* Returns data for **dashboard, charts, records**

**Permissions decide what each user can see.**

---

## 📂 Project Structure

```text
finance_data/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── app.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
└── package.json
```

---

## 🧩 Detailed File Explanation

### 🔹 Root

* **package.json**: Workspace-level scripts to run backend/frontend together
* **README.md**: Main project documentation

---

### 🔹 Backend

* **bootstrap.ts**: Project bootstrap helper
* **server.ts**: Starts server, connects DB, loads env, mounts GraphQL
* **package.json**: Backend dependencies and scripts
* **tsconfig.json**: TypeScript config
* **vitest.config.ts**: Test config
* **README.md**: Backend documentation
* **app.ts**: Express app setup and middleware

#### Config

* **db.ts**: MongoDB connection logic
* **seedUsers.ts**: Default admin/analyst creation

#### Controllers

* **auth.ts**: Login/register logic
* **controller.ts**: User management
* **financeController.ts**: Finance CRUD + analytics
* **permissionController.ts**: Permission workflow
* **schema.ts**: GraphQL schema and resolvers

#### Middleware

* **authMiddleware.ts**: JWT + role check
* **errorHandler.ts**: Global error handler
* **security.ts**: Security configs (CORS, helmet)
* **validate.ts**: Request validation (Zod)

#### Models

* **users.ts**: User schema
* **financeRecord.ts**: Finance data
* **analystPermission.ts**: Permission requests
* **auditLog.ts**: Activity logs

#### Others

* **routes.ts**: API routes
* **auditLogger.ts**: Audit logging helper
* **schemas.ts**: Zod schemas
* **api.test.ts**: API testing

---

### 🔹 Frontend

* **index.html**: Entry HTML
* **package.json**: Frontend scripts
* **tsconfig.json**: TypeScript config
* **vite.config.ts**: Dev server + proxy
* **tailwind.config.js**: Styling config
* **postcss.config.js**: CSS processing
* **README.md**: Frontend notes

#### Core Files

* **main.tsx**: App entry
* **App.tsx**: Routing setup
* **index.css**: Global styles

#### Components

* **PrivateRoute.tsx**: Role-based route protection
* **LoadingSpinner.tsx**: Loader UI
* **PermissionRequestCard.tsx**: Permission UI

#### Feature Modules

* **Dashboard**: Charts and analytics
* **Finance**: Forms and records
* **Users**: User management UI
* **Layout**: Navigation and layout

#### State & Services

* **AuthContext.tsx**: Auth state management

#### API Services

* **api.ts**: Axios setup + token handling
* **authService.ts**: Auth APIs
* **financeService.ts**: Finance APIs
* **userService.ts**: User APIs
* **permissionService.ts**: Permission APIs

#### Utilities

* **index.ts**: Types/interfaces
* **constants.ts**: Roles and access mapping

---

## 🚀 How to Run the Project

### ✅ Prerequisites

* Node.js (v20+)
* npm
* MongoDB running on port 27017

---

### 📥 Option 1: Download ZIP

1. Open GitHub repo
2. Click **Code → Download ZIP**
3. Extract files
4. Open terminal in project folder

---

### 📥 Option 2: Clone Repository

```bash
git clone https://github.com/Ranjith-H7/finance_data.git
cd finance_data
```

---

### 📦 Install Dependencies

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

---

### ⚙️ Backend Setup

```bash
cd backend
cp .env.example .env
```

Update `.env`:

```text
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/finance_data
JWT_SECRET=your_secret_value
CORS_ORIGIN=http://localhost:5173
```

---

### 🌐 Frontend Setup

* Already configured with proxy
* Uses: `VITE_API_URL=/api`

---

### ▶️ Run Project

```bash
npm run dev:all
```

---

### 🌍 Open in Browser

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend: [http://localhost:3000](http://localhost:3000)
* GraphQL: [http://localhost:3000/api/graphql](http://localhost:3000/api/graphql)

---

### ⚡ Run Separately (Optional)

Backend:

```bash
npm --prefix backend run dev
```

Frontend:

```bash
npm --prefix frontend run dev
```

---

## ❗ Common Issues

* MongoDB not running → connection error
* Port already in use → change port or stop process
* Dependencies missing → run install again

---

## 🎯 Final Summary

This system ensures:

* **Secure authentication (JWT)**
* **Strict role-based access control**
* **Real-world financial workflow simulation**
* **Clean separation of Admin, Analyst, Viewer responsibilities**

Users log in, perform actions based on roles, and get **accurate financial insights** without violating permissions.

---

✅ Project is simple, practical, and designed based on real company structure.
