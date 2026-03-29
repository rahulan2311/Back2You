# Deployment Guide

## Recommended stack

- Frontend: Vercel
- Backend API: Railway
- Database: Railway MySQL

## Frontend

1. Deploy the `frontend/` folder as a static site.
2. If the backend is on a different domain, load `frontend/js/config.example.js` before `frontend/js/app.js` and set `window.BACK2YOU_API_BASE_URL` to your backend URL.
3. If you proxy `/api` to your backend on the same domain, no frontend API change is needed.

## Backend

1. Deploy the `backend/` folder as a Node service.
2. Set environment variables from `backend/.env.production.example`.
3. Start command: `npm start`
4. Build/install command: `npm install`

## Database

1. Provision a MySQL database.
2. Run `backend/schema.sql` against it.
3. Copy the connection values into the backend environment.

## Pre-deploy checklist

- `JWT_SECRET` is a long random value
- `CLIENT_URL` and `CLIENT_URLS` match your frontend domain
- Frontend points to the deployed backend URL
- Database tables exist
- Registration, login, lost item, search, and status flows are tested
