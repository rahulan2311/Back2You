# Back2You

Back2You is a lost-and-found web application with a static frontend and a Node.js + Express backend.

## Project Structure

- `frontend/` - static pages and browser-side JavaScript
- `backend/src/` - Express app, routes, controllers, models, and utilities
- `backend/api/` - serverless API entry points for deployment platforms
- `backend/uploads/` - uploaded files placeholder
- `netlify/functions/` - Netlify function bridge
- `netlify.toml` - Netlify build and redirect config
- `DEPLOYMENT.md` - deployment notes

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