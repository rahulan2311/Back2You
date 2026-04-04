# Deployment Guide

## Recommended stack

- Frontend + backend: Netlify
- Database: MongoDB Atlas

## Netlify full-stack setup

1. Connect the GitHub repo to Netlify from the repository root.
2. Netlify will use `netlify.toml`.
3. Build command: `npm install --prefix backend`
4. Publish directory: `frontend`
5. Functions directory: `netlify/functions`
6. Branch to deploy: `master`

## Required environment variables

- `NODE_ENV=production`
- `MONGO_URI=your-mongodb-connection-string`
- `JWT_SECRET=replace-with-a-long-random-secret`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=https://your-netlify-site.netlify.app`
- `CLIENT_URLS=https://your-netlify-site.netlify.app`

## Frontend API

The frontend uses same-origin API calls in production through `frontend/js/config.js`:

```js
window.BACK2YOU_API_BASE_URL = "/api";
```

Netlify routes `/api/*` to the Express function bridge in `netlify/functions/api.js`.

## Important behavior

- The frontend is deployed as static files from `frontend/`
- The backend runs through Netlify Functions
- Report images are URL-based in the current deployment-safe version
- Direct file uploads are not used in production right now

## Pre-deploy checklist

- MongoDB Atlas cluster is reachable from the internet
- Netlify environment variables are set
- `npm run check` passes locally
- Backend function `/api/health` returns success after deploy
- Registration, login, lost item, found item, search, status, and dashboard flows are tested
- Admin-only data access is verified
