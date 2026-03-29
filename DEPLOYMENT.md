# Deployment Guide

## Recommended stack

- Frontend + backend: Netlify
- Database: MongoDB Atlas

## Netlify

1. Connect the GitHub repo to Netlify from the repository root.
2. Netlify will use `netlify.toml`.
3. Build command: `npm install --prefix backend`
4. Publish directory: `frontend`
5. Functions directory: `netlify/functions`

## Required environment variables

- `NODE_ENV=production`
- `MONGO_URI=your-mongodb-connection-string`
- `JWT_SECRET=replace-with-a-long-random-secret`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=https://your-netlify-site.netlify.app`
- `CLIENT_URLS=https://your-netlify-site.netlify.app`

## Frontend API

The frontend uses same-origin API calls through `frontend/js/config.js`:

```js
window.BACK2YOU_API_BASE_URL = "/api";
```

## Pre-deploy checklist

- MongoDB Atlas cluster is reachable from the internet
- Netlify environment variables are set
- Backend function `/api/health` returns success
- Registration, login, lost item, search, and status flows are tested
