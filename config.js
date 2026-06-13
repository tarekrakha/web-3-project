/*
 * config.js — backend connection settings.
 * The frontend lives on GitHub Pages (morvanistore.com); the PHP backend
 * lives on Railway. Every API call goes through API_BASE below.
 *
 * If your Railway URL ever changes, update it HERE ONLY.
 */
const API_BASE = "https://web-3-project-production.up.railway.app";

// Builds a full backend URL, e.g. api("products_api.php") =>
// "https://web-3-project-production.up.railway.app/products_api.php"
function api(path) {
  return API_BASE + "/" + path.replace(/^\/+/, "");
}

// Standard fetch options so the session cookie is sent on every request.
// Spread this into fetch calls: fetch(api("..."), { ...withAuth })
const withAuth = { credentials: "include" };
