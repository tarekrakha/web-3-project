<?php
/**
 * session_api.php
 * Called by frontend JS to check if user is logged in.
 * Returns user info so navbar can show "Welcome, Name" instead of Login/Register.
 */
header("Content-Type: application/json");
session_start();

if (!empty($_SESSION["user_id"])) {
    echo json_encode([
        "logged_in"  => true,
        "user_id"    => $_SESSION["user_id"],
        "first_name" => $_SESSION["first_name"] ?? "",
        "role"       => $_SESSION["role"] ?? "customer"
    ]);
} else {
    echo json_encode(["logged_in" => false]);
}
?>
