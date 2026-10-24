# Himagiri Portfolio — Backend + Admin Dashboard

## What changed from the old repo

1. **Security fix:** the admin username/password were hardcoded in
   `admin-script.js` (public, visible to anyone via "View Source"). Login is
   now checked on the server against `ADMIN_USER` / `ADMIN_PASS` in `.env`,
   which is never committed to Git. **You must set a new password** — the
   old one (`Him@giri` / `444624474`) was exposed in the public GitHub repo
   and should be treated as compromised.

2. **Fixed a broken/disconnected backend:** the old `index.js` (the file
   actually deployed, per `package.json`) never loaded `api.js`, and
   `api.js` itself had a broken `require('../models/Media')` path. So the
   admin dashboard's upload/get/delete calls were hitting routes that didn't
   exist on the live server. Everything is now wired together in one
   `server.js`, and the missing `DELETE /api/delete-media/:id` route has
   been added.

3. **Removed dead code:** `script.js` was an unused duplicate of `main.js`
   (no HTML file referenced it) and has been dropped.

4. **Organized folders** — see structure below instead of ~20 files
   dumped in the repo root.

## Folder structure

```
server.js              → single entry point
config/
  db.js                 → MongoDB connection
  cloudinary.js          → Cloudinary config
models/
  Media.js               → schema for photos/videos/projects
routes/
  auth.js                 → POST /api/login
  media.js                → upload / get / delete media
public/                  → everything served to the browser
  index.html, projects.html, photography.html, ...
  admin-login.html, admin-dashboard.html
  css/                    → all stylesheets
  js/                      → main.js, admin-script.js
  images/, certificates/
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
npm start
```

## Still worth doing next

- Add a Cloudinary `public_id` field to `Media` so deletes are 100% reliable
  (current delete route guesses the id from the URL).
- Add basic rate-limiting to `/api/login` since it's a public endpoint.
- Consider a signed/expiring session instead of a plain success response
  from `/api/login`, so the dashboard page itself checks you're logged in.

## Performance notes

- `public/js/api.js` holds the backend address, Cloudinary URL helpers (`optimizedImage`, `videoPoster`) and a cached media loader. Every page uses it, so the URL is defined in one place.
- Images are requested from Cloudinary as resized, auto-format copies; originals are only used for videos.
- Media lists are cached in the browser, so repeat visits render instantly while fresh data loads in the background.
- Every public page pings `/health` to wake the free Render instance early. For zero cold starts, add a free UptimeRobot monitor that calls `https://himagiri-portfolio.onrender.com/health` every 5 minutes.
- The admin dashboard compresses photos in the browser before upload and supports selecting many files at once.
