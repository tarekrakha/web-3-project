<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
session_start();
require "db.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email    = trim($_POST['email']    ?? '');
    $password =      $_POST['password'] ?? '';

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user && password_verify($password, $user['password'])) {
        // Block blocked accounts
        if (($user['status'] ?? 'active') === 'blocked') {
            echo json_encode(["success"=>false,"message"=>"Your account has been blocked."]);
            exit;
        }

        $_SESSION['user_id']    = $user['id'];
        $_SESSION['role']       = $user['role'];
        $_SESSION['first_name'] = $user['first_name'];

        if ($user['role'] === 'admin') {
            echo json_encode(["success"=>true,"redirect"=>"adminproducts.html"]);
        } else {
            echo json_encode(["success"=>true,"redirect"=>"index.html"]);
        }
        exit;
    }

    echo json_encode(["success"=>false,"message"=>"Invalid email or password."]);
}
?>
