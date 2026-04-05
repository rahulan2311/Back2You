# Back2You

Back2You is a lost-and-found web application with a static frontend and a Node.js + Express backend.

Recommended deployment:
- `frontend/` on Netlify
- `backend/` as a Render Web Service
- MongoDB on Atlas

## Project Structure

- `frontend/` - static pages and browser-side JavaScript
- `backend/src/` - Express app, routes, controllers, models, and utilities
- `backend/api/` - serverless API entry points for deployment platforms
- `backend/uploads/` - uploaded files placeholder
- `netlify/functions/` - optional Netlify function bridge
- `netlify.toml` - Netlify build and redirect config
- `DEPLOYMENT.md` - deployment notes
- `scripts/validate-deploy.js` - lightweight deployment validation script

## Run Locally

```bash
npm run dev
```

Then open `http://localhost:5000`.

## Production Frontend Config

For a Netlify frontend with a Render backend:

1. Copy `frontend/js/config.example.js` to `frontend/js/config.production.js`
2. Set `window.BACK2YOU_API_BASE_URL` to your Render API URL
3. Deploy `frontend/` to Netlify

## Deployment Validation

Run this before deployment:

```bash
npm run check
```

or:

```bash
npm run validate:deploy
```

The check verifies:
- required project files exist
- env example files include required keys
- deployment config files exist
- the local health endpoint responds

## Keep These Files

- frontend pages and `frontend/js/`
- backend source files, `package.json`, and `package-lock.json`
- `.env.example` and `.env.production.example`
- deployment config files for Netlify and Vercel

## Local-Only Files

Do not commit these:

- `backend/.env`
- `backend/node_modules/`
- local log files
- editor swap files
