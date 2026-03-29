# Back2You Backend

This backend is a `Node.js + Express + MongoDB` API for the Back2You lost-and-found project.

## Features

- User registration and login with JWT auth
- Lost item and found item reporting
- Search by item name, category, tracking code, or status
- Status tracking by tracking code
- Ownership claims workflow
- Feedback submission
- Dashboard summary endpoint
- Optional image upload support through `multer`
- Netlify Functions and Vercel-compatible serverless entry points

## Run Locally

1. Create a `.env` file from `.env.example`
2. Install packages:

```bash
npm install
```

3. Start the API:

```bash
npm run dev
```

## Main routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/items/lost`
- `POST /api/items/found`
- `GET /api/items/search`
- `GET /api/items/status/:trackingCode`
- `GET /api/items/mine`
- `GET /api/items/dashboard/summary`
- `PATCH /api/items/:itemId/status`
- `POST /api/claims`
- `PATCH /api/claims/:claimId/review`
- `POST /api/feedback`
- `GET /api/feedback`

## Production database

Use MongoDB Atlas or another hosted MongoDB provider and set `MONGO_URI` in production.
