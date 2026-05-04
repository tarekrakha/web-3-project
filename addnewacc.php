<?php
require "db.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $first = trim($_POST['first_name'] ?? '');
    $last = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($first === '' || $last === '' || $email === '' || $password === '') {
        die("Please fill all fields. <a href='create.html'>Go back</a>");
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $first, $last, $email, $hashed);

    if ($stmt->execute()) {
        echo "Account created successfully. <a href='login.html'>Login</a>";
    } else {
        echo "Email already exists or account could not be created. <a href='create.html'>Try again</a>";
    }
}
?>
