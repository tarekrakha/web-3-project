════════════════════════════════════════════════════════════
  MORVENI — OPTION B
  Frontend on GitHub Pages  +  Backend on Railway
════════════════════════════════════════════════════════════

You have TWO folders. They deploy to TWO different places.

  frontend-github-pages/  →  GitHub Pages (morvanistore.com)
  backend-railway/        →  Railway (web-3-project-production.up.railway.app)

────────────────────────────────────────────────────────────
HOW IT WORKS
────────────────────────────────────────────────────────────
The static site (HTML/CSS/JS) is served by GitHub Pages.
Every data action (login, products, checkout, orders, admin)
is a fetch() call to the PHP backend on Railway. The backend
talks to MySQL. Login stays working across the two domains
because the backend sends CORS headers for morvanistore.com
and uses a SameSite=None; Secure session cookie.

────────────────────────────────────────────────────────────
PART 1 — DEPLOY THE BACKEND (Railway)   ← do this FIRST
────────────────────────────────────────────────────────────
1. Put the CONTENTS of backend-railway/ at the root of a
   GitHub repo (e.g. morveni-backend).
2. railway.app → New Project → Deploy from GitHub repo.
3. New → Database → Add MySQL.
4. Web service → Variables → add references from the MySQL
   service: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD,
   MYSQLDATABASE, MYSQLPORT.
5. Import the database:
     mysql -h HOST -P PORT -u USER -pPASS DBNAME < morveni_db.sql
6. Web service → Settings → Networking → Generate Domain.
   Confirm it is exactly:
     web-3-project-production.up.railway.app
   (If Railway gives a DIFFERENT domain, update API_BASE in
    frontend-github-pages/config.js to match.)

────────────────────────────────────────────────────────────
PART 2 — DEPLOY THE FRONTEND (GitHub Pages)
────────────────────────────────────────────────────────────
1. Put the CONTENTS of frontend-github-pages/ at the root of
   a SECOND GitHub repo (e.g. morveni-store).
2. Repo → Settings → Pages → Source: deploy from branch
   (main / root). Save.
3. Settings → Pages → Custom domain: morvanistore.com
   Add the DNS records GitHub shows at your registrar.
4. Wait for HTTPS to turn on (GitHub provisions the cert).

────────────────────────────────────────────────────────────
IMPORTANT — KEEPING THE TWO IN SYNC
────────────────────────────────────────────────────────────
• Backend URL lives in ONE place: config.js  (API_BASE).
  Change it there if your Railway domain changes.
• Allowed frontend origin lives in ONE place: cors.php
  ($allowedOrigins). It is currently set to:
     https://morvanistore.com
     https://www.morvanistore.com
  If you add another domain, add it to that list too —
  it MUST be an exact match or the browser blocks login.

────────────────────────────────────────────────────────────
NOTES
────────────────────────────────────────────────────────────
• Product image uploads: Railway disk is ephemeral; uploaded
  files vanish on redeploy. Use a Railway Volume at /app/uploads
  or Cloudinary/S3 if you need them to persist.
• Make yourself admin: register, then in Railway MySQL run
     UPDATE users SET role='admin' WHERE email='YOUR_EMAIL';
• Local testing (XAMPP) still works: config.js can point
  API_BASE to "http://localhost/web-3-project-updated" and
  cors.php already falls through harmlessly on same-origin.
════════════════════════════════════════════════════════════
