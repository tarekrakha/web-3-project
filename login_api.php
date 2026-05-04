<?php
session_start();
require "db.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        if ($user['role'] === 'admin') {
            header("Location: adminproducts.html");
        } else {
            header("Location: homepage.html");
        }
        exit;
    }

    echo "Invalid email or password. <a href='login.html'>Try again</a>";
}
?>
