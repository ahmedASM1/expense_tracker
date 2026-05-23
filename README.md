# Expense Tracker Platform

A cloud-based personal expense tracking system built with Next.js, Node.js Express, and AWS.

---

## Tech stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4 | Vercel |
| Backend | Node.js, Express | AWS EC2 (Docker / PM2) |
| Database | PostgreSQL 15 | AWS RDS (local: Docker) |
| Storage | Receipt images | AWS S3 |
| Auth | JWT | AWS Cognito |
| Email | Transactional mail | AWS SES |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux)
- Git

Docker will set up the environment and start PostgreSQL, the Express backend, and the Next.js frontend locally.

---

## Getting started

### 1. Clone and configure

```bash
git clone https://github.com/ahmedASM1/expense_tracker.git
cd expense_tracker
cp .env.example .env
# Edit .env — add AWS credentials if using S3/SES/Cognito
# Leave COGNITO_* blank for local dev auth (any email/password works)
```

### 2. Start all services

```bash
docker compose up --build
```

This starts:

- **Frontend** at [http://localhost:3002](http://localhost:3002)
- **Backend API** at [http://localhost:4000](http://localhost:4000)
- **PostgreSQL** at `localhost:5433` (schema applied on first run via `db/migrations/`)

### 3. Verify it's working

```bash
curl http://localhost:4000/api/health
# {"status":"ok","environment":"development","database":"connected",...}
```

Open [http://localhost:3002](http://localhost:3002) — sign in with any email and password in dev mode (uses seeded user `user@dev.local`).

---

## Useful commands

```bash
# Start in background
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down

# Wipe the database and start fresh
docker compose down -v
docker compose up --build

# Run backend without Docker (requires Postgres on :5433)
npm run dev:backend

# Run frontend without Docker
npm run dev:frontend
```

---

## Project structure

```
expense_tracker/
├── frontend/                 # Next.js 15 app
│   ├── app/                  # App Router pages (dashboard, auth)
│   ├── components/           # Shared React components
│   └── lib/                  # API client and auth utilities
├── backend/                  # Node.js Express API
│   └── src/
│       ├── routes/           # HTTP endpoints (auth, expenses, budgets, …)
│       ├── services/         # S3 uploads, SES email
│       ├── middleware/       # JWT / dev cookie auth
│       └── db/               # PostgreSQL connection pool
├── db/
│   └── migrations/           # SQL files — run in filename order
├── infra/                    # AWS CLI / setup scripts
├── lambda/                   # Serverless functions (optional)
├── docker-compose.yml
├── deploy.sh                 # Deploy backend to EC2
└── .env.example
```

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check + DB connectivity |
| GET/PATCH | `/api/auth/me` | Current user profile |
| CRUD | `/api/expenses` | Expense records + receipt keys |
| CRUD | `/api/categories` | Spending categories |
| PUT/DELETE | `/api/budgets` | Monthly category budgets |

All protected routes expect a JWT (Cognito) or, in development, the `auth_token` cookie (`local-user-sub` / `local-admin-sub`).

---

## Deployment

- **Frontend:** Connect the `frontend/` directory to Vercel; set `BACKEND_URL` to your EC2 API URL.
- **Backend:** Run `./deploy.sh` to copy the API to EC2, apply migrations, and start with PM2 (requires `expense-tracker-key.pem` and `.env` configured for RDS).
