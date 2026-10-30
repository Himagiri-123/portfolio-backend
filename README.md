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

## Admin dashboard notes

- Uploads without a title are named `Himagiri_Photos_clicks_0001`, `Himagiri_Videos_clicks_0001`, ... A typed title is always used as given.
- Projects marked with the star appear on the homepage slider (it auto-slides every 10 seconds when more cards exist than fit on screen).
- "Import" buttons copy the built-in projects and About text into the dashboard so they can be edited or deleted. Once any project exists in the dashboard, the built-in ones are hidden on the site until imported.
- About text supports `**bold**` and `*italic*`.

## Sliders, galleries and skill cards

- Projects, Technical Core and Creative Vision are auto-sliding carousels with one dot per card (`public/js/ui.js`).
- Galleries and certificate pages are paginated and have a Small / Medium / Large switcher.
- Skill cards (Technical / Creative) are managed in the dashboard. A card can open a page or a named collection: type a Collection name when uploading photos or videos, then pick "Photos collection: <name>" as the card link.
- Pinned photos and videos (thumbtack button) always appear first in their gallery.

## Security (JWT)

- Logging in returns a signed token (JWT) valid for one hour. Every route that adds, changes or deletes data requires it; reading data stays public.
- Set `JWT_SECRET` (any long random text) in the Render environment variables. If it is missing, a secret is derived from the admin login so the site still works, but set it anyway.
- Login is limited to 10 failed attempts per 15 minutes per visitor.
- Photo/video uploads still go straight to Cloudinary with an unsigned preset (`himagiri_preset`); restrict that preset in the Cloudinary dashboard (allowed formats, max file size) if you want to limit abuse.

## Editable from the dashboard

Photos, videos, projects, About photo and text, Technical and Creative skill cards, certificates (any number of groups), Hero texts (name, typing words, intro points) and Contact/footer details (email, location, social links). Each section has an Import button that copies the text currently written in the HTML so it can be edited.
