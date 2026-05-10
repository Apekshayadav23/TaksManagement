# TaskFlow - Team Task Manager (Full-Stack)

A full-stack Team Task Manager built with React + Express + SQLite + Sequelize.

## Features

- Authentication: Signup/Login with JWT
- Role-based access control: `admin` / `member`
- Project management: create, edit, delete projects (admin)
- Team/project relationships: assign members to projects
- Task management: create, assign, update, delete tasks
- Dashboard: total tasks, progress by status, overdue tracking
- Validation + error handling on frontend and backend
- Responsive UI

## Tech Stack

- Frontend: React (Vite)
- Backend: Node.js, Express
- Database: SQLite (via Sequelize ORM)
- Auth/Security: bcryptjs password hashing + JWT

## Project Structure

```txt
taskflow/
├── server/
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── middleware/
│       │   ├── authenticate.js
│       │   ├── authorize.js
│       │   └── errorHandler.js
│       ├── models/
│       │   ├── index.js
│       │   ├── user.js
│       │   ├── project.js
│       │   ├── projectMember.js
│       │   └── task.js
│       ├── routes/
│       │   ├── index.js
│       │   ├── auth.routes.js
│       │   ├── users.routes.js
│       │   ├── projects.routes.js
│       │   ├── tasks.routes.js
│       │   └── dashboard.routes.js
│       ├── utils/
│       │   ├── access.js
│       │   ├── asyncHandler.js
│       │   ├── auth.js
│       │   └── httpError.js
│       ├── app.js
│       └── server.js
├── src/
│   ├── api/client.js
│   ├── config/constants.js
│   ├── components/
│   │   ├── AuthPage.jsx
│   │   ├── Sidebar.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── TasksPage.jsx
│   │   ├── TeamPage.jsx
│   │   └── common.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Run frontend + backend together:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Demo Accounts (seeded automatically)

- Admin: `admin@demo.com` / `admin123`
- Member: `member@demo.com` / `member123`

## Scripts

- `npm run dev` - run React + API in parallel
- `npm run dev:client` - frontend only
- `npm run dev:server` - backend only
- `npm run lint` - lint code
- `npm run build` - build frontend
- `npm run start` - production server (serves API + built frontend)

## Environment Variables

Create `.env` in project root:

```env
PORT=5000
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=7d
SQLITE_DB_PATH=server/data/taskflow.sqlite
CORS_ORIGIN=*
```

## Railway Deployment (Mandatory)

1. Push this repo to GitHub.
2. Create a new Railway project from your repo.
3. In Railway service settings:
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
4. Set environment variables in Railway:
- `NODE_ENV=production`
- `JWT_SECRET=<strong-secret>`
- `PORT=5000`
- `SQLITE_DB_PATH=/data/taskflow.sqlite`
5. Add a Railway Volume and mount it at `/data` (for persistent SQLite storage).
6. Deploy and open your Railway URL.

## API Base

- Health: `GET /api/health`
- Auth: `/api/auth/*`
- Users (admin): `/api/users/*`
- Projects: `/api/projects/*`
- Tasks: `/api/tasks/*`
- Dashboard: `/api/dashboard`
