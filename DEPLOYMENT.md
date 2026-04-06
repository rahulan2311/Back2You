# Deployment Guide

## Recommended stack

- Frontend: Netlify
- Backend API: Render Web Service
- Database: MongoDB Atlas
- Image storage: Cloudinary

## Render backend setup

1. Create a Render Web Service from the `backend` directory.
2. Build command: `npm install`
3. Start command: `npm start`
4. Health check path: `/api/health`
5. Use Node `20`

## Required backend environment variables

- `NODE_ENV=production`
- `MONGO_URI=your-mongodb-atlas-connection-string`
- `JWT_SECRET=replace-with-a-long-random-secret`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=https://your-netlify-site.netlify.app`
- `CLIENT_URLS=https://your-netlify-site.netlify.app`
- `CLOUDINARY_CLOUD_NAME=your-cloud-name`
- `CLOUDINARY_API_KEY=your-api-key`
- `CLOUDINARY_API_SECRET=your-api-secret`
- `CLOUDINARY_FOLDER=back2you`

## Netlify frontend setup

1. Copy `frontend/js/config.example.js` to `frontend/js/config.production.js`
2. Update `window.BACK2YOU_API_BASE_URL` to your Render backend URL
3. Connect the repo root to Netlify
4. Netlify will use `netlify.toml`
5. Publish directory: `frontend`
6. Branch to deploy: `master`

Example production frontend config:

```js
window.BACK2YOU_API_BASE_URL = "https://your-render-service.onrender.com/api";
```

## Important behavior

- The frontend is deployed as static files from `frontend/`
- The backend runs as a Render web service
- MongoDB Atlas is the production database
- Report images upload to Cloudinary when the Cloudinary env vars are set
- Plain `imageUrl` values still work as a fallback for older clients

## Pre-deploy checklist

- MongoDB Atlas cluster is reachable from the internet
- Render environment variables are set, including Cloudinary keys
- `frontend/js/config.production.js` points to the Render backend
- `npm run check` passes locally
- Backend route `/api/health` returns success after deploy
- Registration, login, lost item, found item, search, status, and dashboard flows are tested
- Image upload works for both lost and found reports
- Admin-only data access is verified
