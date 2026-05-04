<?php
// XAMPP default connection. Change the password only if your phpMyAdmin root user has one.
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "morveni_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");
?>
