# PennyTrack — Personal Expense Tracker (MERN + Login + Pennywise AI)

## Features
- Register and log in with an email and password.
- Passwords are hashed with bcryptjs; the API returns a signed JWT with a 24-hour expiry.
- The Dashboard, Transactions, Reports, and Pennywise AI endpoints require authentication.
- Transactions are associated with the logged-in user; listing, editing, deletion, summaries, demo data, and AI insights are scoped to that user.
- Add, view, edit, delete, and filter income and expense transactions.
- Monthly totals and category-wise expense summaries use MongoDB aggregation.
- Existing AI agent supports built-in financial guidance and optional Gemini responses.

## Requirements
- Node.js 20+ recommended
- MongoDB Community Server running locally, or a MongoDB connection URI
- VS Code (or another editor)

## First-time setup (Windows PowerShell)

### 1. Configure the backend
Open a terminal in the project root:

```powershell
cd server
# Run this only if server/.env does not already exist:
Copy-Item .env.example .env
```

Open `server/.env`. If it already existed, keep its current MongoDB URI and Gemini settings, and add `JWT_SECRET=your-own-random-secret-at-least-32-characters` on a new line. Set `JWT_SECRET` to a unique random secret containing at least 32 characters; do not use the example text as a production secret. Keep `.env` private. Set `MONGODB_URI` if you use a different MongoDB address. Add `GEMINI_API_KEY` only if you want Gemini-powered responses; Pennywise's built-in responses work without a key.

Install packages and start the backend:

```powershell
npm.cmd install
npm.cmd run dev
```

The API runs at `http://localhost:5000`.

### 2. Start the frontend
Open a second terminal from the project root:

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Use the app
1. Create an account on the registration screen.
2. Log in with that email and password.
3. Use Dashboard, Transactions, Reports, and AI Agent as usual.
4. Select **Log out** to end the session.

## API endpoints
Public:
- `GET /api/health`
- `POST /api/auth/register` — JSON: `{ "name": "Example User", "email": "user@example.com", "password": "at-least-8-characters" }`
- `POST /api/auth/login` — JSON: `{ "email": "user@example.com", "password": "at-least-8-characters" }`

Authenticated (send `Authorization: Bearer <token>`):
- `GET /api/auth/me`
- `GET /api/transactions?month=YYYY-MM`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `POST /api/transactions/demo-data?month=YYYY-MM`
- `GET /api/summary?month=YYYY-MM`
- `GET /api/agent/insights?month=YYYY-MM`
- `POST /api/agent/chat`

## Important note about older transactions
Transactions saved before login was added have no owner field, so authenticated users will not see them in the new UI. Those old MongoDB documents are not deleted. If you need to keep them, back up the database first and explicitly assign them to the correct user's MongoDB ObjectId before using the authenticated app. Do not assign old records to an account unless you know they belong to that account.

## Security note
This is an educational/local project starter. Use HTTPS, a strong private `JWT_SECRET`, rate limiting, and a more secure production session/token strategy before exposing it to the public internet. Do not commit `.env` or expose your Gemini API key in the frontend.
