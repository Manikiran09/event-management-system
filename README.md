# Event Management MERN App

This project is a strict MERN stack setup:
- MongoDB for database
- Express + Node.js for backend API
- React + Vite for frontend UI

## Roles
- admin
- organizer
- participant

## Role Capabilities
- admin: manage users and all events
- organizer: create events and manage own events
- participant: browse events, register, and cancel own registrations

## Project Structure
- backend: Express API with JWT auth and MongoDB models
- frontend: React + Vite client

## Backend Setup
1. Go to backend folder
2. Copy `.env.example` to `.env`
3. Configure values in `.env`
4. Start server

```bash
cd backend
npm install
npm run dev
```

Backend runs at `http://localhost:5112`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Deployment

### GitHub Auto Deploy (main branch)
This repository includes GitHub Actions workflows that trigger deploy hooks on every push to `main`:
- Frontend workflow: `.github/workflows/deploy-frontend.yml`
- Backend workflow: `.github/workflows/deploy-backend.yml`

Add these repository secrets in GitHub (**Settings -> Secrets and variables -> Actions**):
- `VERCEL_DEPLOY_HOOK_URL` (from your Vercel project's Deploy Hooks)
- `RAILWAY_DEPLOY_HOOK_URL` (from your Railway service Deploy Hook)

Once secrets are set, pushes to `main` will automatically trigger both deployments when matching files change.

### Backend on Railway
1. Push this project to GitHub.
2. In Railway, create a new project from this repo.
3. Deploy using `railway.toml` (already included at project root).
4. Add these Railway environment variables:
	- `MONGO_URI=your-mongodb-connection-string`
	- `MONGO_DB_NAME=event_management`
	- `JWT_SECRET=your-strong-secret`
	- `JWT_EXPIRES_IN=1d`
	- `ADMIN_REGISTRATION_KEY=your-admin-registration-key`
	- `FRONTEND_URL=https://your-vercel-app.vercel.app`
5. Deploy and copy your Railway backend URL:
	- Example: `https://your-service.up.railway.app`

Notes:
- `PORT` is injected by Railway automatically.
- To allow multiple frontend domains, set `FRONTEND_URL` as comma-separated origins.

### Frontend on Vercel
1. In Vercel, import this GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: `Vite`.
4. Add environment variable in Vercel project:
	- `VITE_API_BASE_URL=https://your-service.up.railway.app/api`
5. Deploy.

`frontend/vercel.json` is included to ensure SPA routing works with direct/deep links.

If `VITE_API_BASE_URL` is not set, the frontend falls back to local/proxy candidates and then prompts for a manual API URL on the login screen.
Use the manual override only when you intentionally want a different backend target.

## Main API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/auth/users` (admin only)

### Event Endpoints
- `GET /api/events` (all logged in roles)
- `POST /api/events` (admin, organizer)
- `PATCH /api/events/:eventId` (admin or event owner organizer)
- `DELETE /api/events/:eventId` (admin or event owner organizer)

### Registration Endpoints
- `GET /api/registrations/me` (participant)
- `POST /api/registrations/:eventId` (participant)
- `PATCH /api/registrations/:eventId/cancel` (participant)

## Admin Registration
To register as `admin`, send `adminKey` in registration payload that matches `ADMIN_REGISTRATION_KEY` from backend `.env`.

## Frontend Pages
- `/login`
- `/register`
- `/dashboard`
- `/events`
- `/my-registrations` (participant only)
