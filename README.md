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

## Run On Linux/macOS (Terminal)

Use these commands from a terminal:

```bash
cd /path/to/event-management-system
npm install
npm run install:all
npm run dev
```

This starts backend and frontend together in one terminal.

If you prefer separate terminals:

```bash
# terminal 1
cd backend
npm install
npm run dev

# terminal 2
cd frontend
npm install
npm run dev
```

Optional (for local API proxy in frontend dev):

```bash
cd frontend
echo "VITE_DEV_API_PROXY=http://localhost:5112" > .env
```

## Deployment

### Backend on Render
1. Push this project to GitHub.
2. In Render, create a new `Web Service` and connect your repo.
3. Use these settings:
	- Root Directory: `backend`
	- Build Command: `npm install`
	- Start Command: `npm start`
4. Add environment variables in Render:
	- `MONGO_URI=mongodb+srv://admin:123@cluster0.fu6jdht.mongodb.net/event_management?retryWrites=true&w=majority&appName=Cluster0`
	- `JWT_SECRET=dev-secret-change-this`
	- `JWT_EXPIRES_IN=1d` 
	- `ADMIN_REGISTRATION_KEY=admin-secret-key`
	- `PORT=5112`
 	- `FRONTEND_URL=http://localhost:5173`





5. Deploy and copy your backend URL (example: `https://your-app.onrender.com`).

You can also deploy with the Render blueprint file at `render.yaml`.

### Frontend on GitHub Pages
1. In GitHub repo settings, enable `Pages` with source `GitHub Actions`.
2. Add repo variable:
	- `VITE_API_BASE_URL` = `https://your-app.onrender.com/api`
3. Push to `main`.
4. Workflow `.github/workflows/deploy-frontend.yml` will build and deploy automatically.

Note: Frontend routing uses `HashRouter` for reliable deep-link support on GitHub Pages.

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
