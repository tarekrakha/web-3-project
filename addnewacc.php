<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
session_start();
require "db.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $first    = trim($_POST['first_name'] ?? '');
    $last     = trim($_POST['last_name']  ?? '');
    $email    = trim($_POST['email']      ?? '');
    $password =      $_POST['password']  ?? '';

    if ($first === '' || $last === '' || $email === '' || $password === '') {
        echo json_encode(["success"=>false,"message"=>"Please fill all fields."]);
        exit;
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt   = $conn->prepare("INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $first, $last, $email, $hashed);

    if ($stmt->execute()) {
        // Auto-login after registration
        $newUser = $conn->prepare("SELECT id, first_name, role FROM users WHERE email = ? LIMIT 1");
        $newUser->bind_param("s", $email);
        $newUser->execute();
        $user = $newUser->get_result()->fetch_assoc();

        $_SESSION['user_id']    = $user['id'];
        $_SESSION['role']       = $user['role'];
        $_SESSION['first_name'] = $user['first_name'];

        echo json_encode(["success"=>true,"redirect"=>"index.html"]);
        exit;
    } else {
        echo json_encode(["success"=>false,"message"=>"Email already exists."]);
    }
}
?>
