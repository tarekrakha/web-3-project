<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
session_start();
require "db.php";

if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success"=>false,"message"=>"Not logged in."]);
    exit;
}

$userId = intval($_SESSION["user_id"]);
$method = $_SERVER["REQUEST_METHOD"];
$action = $_POST["action"] ?? $_GET["action"] ?? "list";

// ── GET saved addresses ───────────────────────────────────────────────────────
if ($method === "GET") {
    $stmt = $conn->prepare("SELECT * FROM user_addresses WHERE user_id=? ORDER BY is_default DESC, id DESC");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $addresses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode(["success"=>true,"addresses"=>$addresses]);
    exit;
}

// ── SAVE new address ──────────────────────────────────────────────────────────
if ($action === "save") {
    $label    = trim($_POST["label"]     ?? "Home");
    $fullName = trim($_POST["full_name"] ?? "");
    $phone    = trim($_POST["phone"]     ?? "");
    $city     = trim($_POST["city"]      ?? "");
    $street   = trim($_POST["street"]    ?? "");

    if (!$fullName || !$phone || !$city || !$street) {
        http_response_code(400);
        echo json_encode(["success"=>false,"message"=>"All address fields required."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO user_addresses (user_id, label, full_name, phone, city, street) VALUES (?,?,?,?,?,?)");
    $stmt->bind_param("isssss", $userId, $label, $fullName, $phone, $city, $street);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Address saved.","id"=>$conn->insert_id]);
    exit;
}

// ── SET default address ───────────────────────────────────────────────────────
if ($action === "set_default") {
    $addrId = intval($_POST["address_id"] ?? 0);
    $conn->query("UPDATE user_addresses SET is_default=0 WHERE user_id=$userId");
    $stmt = $conn->prepare("UPDATE user_addresses SET is_default=1 WHERE id=? AND user_id=?");
    $stmt->bind_param("ii", $addrId, $userId);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Default address updated."]);
    exit;
}

// ── DELETE address ────────────────────────────────────────────────────────────
if ($action === "delete") {
    $addrId = intval($_POST["address_id"] ?? 0);
    $stmt = $conn->prepare("DELETE FROM user_addresses WHERE id=? AND user_id=?");
    $stmt->bind_param("ii", $addrId, $userId);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Address removed."]);
    exit;
}

http_response_code(400);
echo json_encode(["success"=>false,"message"=>"Unknown action."]);
?>
