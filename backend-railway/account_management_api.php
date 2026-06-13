<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
session_start();
require "db.php";

// Simple admin guard
if (empty($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["success"=>false,"message"=>"Admin access required."]);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];
$action = $_POST["action"] ?? $_GET["action"] ?? "list";

// ── LIST all users ────────────────────────────────────────────────────────────
if ($method === "GET") {
    $q      = trim($_GET["q"]      ?? "");
    $role   = trim($_GET["role"]   ?? "all");
    $status = trim($_GET["status"] ?? "all");

    $where  = [];
    $params = [];
    $types  = "";

    if ($q !== "") {
        $like = "%$q%";
        $where[]  = "(CONCAT(first_name,' ',last_name) LIKE ? OR email LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $types   .= "ss";
    }
    if ($role !== "all") {
        $where[]  = "role = ?";
        $params[] = $role;
        $types   .= "s";
    }
    if ($status !== "all") {
        $where[]  = "status = ?";
        $params[] = $status;
        $types   .= "s";
    }

    $sql = "SELECT id, first_name, last_name, email, role, status, created_at FROM users";
    if ($where) $sql .= " WHERE " . implode(" AND ", $where);
    $sql .= " ORDER BY id DESC";

    $stmt = $conn->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $users = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode(["success"=>true,"users"=>$users]);
    exit;
}

// ── ADD user ──────────────────────────────────────────────────────────────────
if ($action === "add") {
    $first  = trim($_POST["first_name"] ?? "");
    $last   = trim($_POST["last_name"]  ?? "");
    $email  = trim($_POST["email"]      ?? "");
    $pass   = $_POST["password"]        ?? "";
    $role   = trim($_POST["role"]       ?? "customer");
    $status = trim($_POST["status"]     ?? "active");

    if (!$first || !$last || !$email || !$pass) {
        http_response_code(400);
        echo json_encode(["success"=>false,"message"=>"All fields required."]);
        exit;
    }
    $hashed = password_hash($pass, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password, role, status) VALUES (?,?,?,?,?,?)");
    $stmt->bind_param("ssssss", $first, $last, $email, $hashed, $role, $status);
    if ($stmt->execute()) {
        echo json_encode(["success"=>true,"message"=>"User added.","id"=>$conn->insert_id]);
    } else {
        echo json_encode(["success"=>false,"message"=>"Email already exists."]);
    }
    exit;
}

// ── UPDATE user (name / role / status) ───────────────────────────────────────
if ($action === "update") {
    $id     = intval($_POST["id"]     ?? 0);
    $role   = trim($_POST["role"]     ?? "customer");
    $status = trim($_POST["status"]   ?? "active");
    $name   = trim($_POST["name"]     ?? "");

    if ($name !== "") {
        $parts = explode(" ", $name, 2);
        $first = $parts[0];
        $last  = $parts[1] ?? "";
        $stmt  = $conn->prepare("UPDATE users SET first_name=?, last_name=?, role=?, status=? WHERE id=?");
        $stmt->bind_param("ssssi", $first, $last, $role, $status, $id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET role=?, status=? WHERE id=?");
        $stmt->bind_param("ssi", $role, $status, $id);
    }
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"User updated."]);
    exit;
}

// ── DELETE user ───────────────────────────────────────────────────────────────
if ($action === "delete") {
    $id = intval($_POST["id"] ?? 0);
    $stmt = $conn->prepare("DELETE FROM users WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"User deleted."]);
    exit;
}

http_response_code(400);
echo json_encode(["success"=>false,"message"=>"Unknown action."]);
?>
