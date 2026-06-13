<?php
// Cross-origin setup so the GitHub Pages frontend (morvanistore.com) can talk
// to this Railway backend AND stay logged in. Must run before any session_start().

// Exact allowed origins (NOT "*", because credentialed cross-site cookies require an exact origin).
$allowedOrigins = [
    "https://morvanistore.com",
    "https://www.morvanistore.com"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Vary: Origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

// Answer the browser's CORS preflight immediately.
if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Make PHP session cookies work across domains:
// SameSite=None + Secure lets the browser send the session cookie on cross-site requests.
session_set_cookie_params([
    "lifetime" => 0,
    "path"     => "/",
    "secure"   => true,
    "httponly" => true,
    "samesite" => "None"
]);
?>
