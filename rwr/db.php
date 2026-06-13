<?php
// Railway uses environment variables for the DB. Falls back to XAMPP defaults for local use.
$host   = getenv("MYSQLHOST")     ?: "localhost";
$user   = getenv("MYSQLUSER")     ?: "root";
$pass   = getenv("MYSQLPASSWORD") ?: "";
$dbname = getenv("MYSQLDATABASE") ?: "morveni_db";
$port   = getenv("MYSQLPORT")     ?: 3306;

// PHP 8.1+ throws on connection failure; catch it so we return clean JSON instead of a fatal.
mysqli_report(MYSQLI_REPORT_OFF);

$conn = new mysqli($host, $user, $pass, $dbname, $port);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");
?>
