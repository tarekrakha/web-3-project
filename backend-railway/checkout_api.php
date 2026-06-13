<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
session_start();
require "db.php";

// ── Block guests from placing orders ─────────────────────────────────────────
if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success"=>false,"message"=>"Please log in before placing an order.","redirect"=>"login.html"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["success"=>false,"message"=>"No order data received."]);
    exit;
}

$userId      = intval($_SESSION["user_id"]);
$payment     = trim($data["payment_method"] ?? "");
$items       = $data["items"]               ?? [];
$subtotal    = floatval($data["subtotal"]   ?? 0);
$shipping    = floatval($data["shipping"]   ?? 5);
$total       = floatval($data["total"]      ?? ($subtotal + $shipping));
$saveAddress = !empty($data["save_address"]);

// ── Resolve address fields ────────────────────────────────────────────────────
// If a saved address was selected, look it up from the DB.
// Otherwise use the fields submitted directly in the payload.
$savedAddressId = intval($data["saved_address_id"] ?? 0);

if ($savedAddressId > 0) {
    $sa = $conn->prepare(
        "SELECT full_name, phone, city, street FROM user_addresses WHERE id = ? AND user_id = ?"
    );
    $sa->bind_param("ii", $savedAddressId, $userId);
    $sa->execute();
    $row = $sa->get_result()->fetch_assoc();

    if (!$row) {
        http_response_code(400);
        echo json_encode(["success"=>false,"message"=>"Saved address not found."]);
        exit;
    }

    $name      = $row["full_name"];
    $phone     = $row["phone"];
    $city      = $row["city"];
    $street    = $row["street"];
    $addrFront = "";
    $addrBack  = "";
} else {
    $name      = trim($data["name"]          ?? "");
    $phone     = trim($data["phone"]         ?? "");
    $city      = trim($data["city"]          ?? "");
    $street    = trim($data["street"]        ?? "");
    $addrFront = trim($data["address_front"] ?? "");
    $addrBack  = trim($data["address_back"]  ?? "");
}

if ($name === "" || $phone === "" || $city === "" || $street === "" || $payment === "") {
    http_response_code(400);
    echo json_encode(["success"=>false,"message"=>"Please complete address and payment details."]);
    exit;
}

// Optionally save new address to user_addresses
if ($saveAddress) {
    $label = trim($data["address_label"] ?? "Home");
    $sa = $conn->prepare("INSERT INTO user_addresses (user_id, label, full_name, phone, city, street) VALUES (?,?,?,?,?,?)");
    $sa->bind_param("isssss", $userId, $label, $name, $phone, $city, $street);
    $sa->execute();
}

$conn->begin_transaction();
try {
    $tracking = "MORV-" . strtoupper(substr(md5(uniqid()), 0, 8));

    $stmt = $conn->prepare("
        INSERT INTO orders
            (user_id, customer_name, phone, city, street, address_front, address_back, payment_method, subtotal, shipping, total, tracking_code)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ");
    $stmt->bind_param("isssssssddds",
        $userId, $name, $phone, $city, $street,
        $addrFront, $addrBack, $payment,
        $subtotal, $shipping, $total, $tracking
    );
    $stmt->execute();
    $orderId = $conn->insert_id;

    $itemStmt = $conn->prepare("
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, size, color)
        VALUES (?,?,?,?,?,?,?)
    ");

    if (count($items) === 0) {
        $items[] = ["id"=>null,"name"=>"Cart items","quantity"=>1,"price"=>$subtotal,"size"=>"","color"=>""];
    }

    foreach ($items as $item) {
        $productId   = isset($item["id"]) ? intval($item["id"]) : null;
        $productName = trim($item["name"]     ?? "Product");
        $quantity    = intval($item["quantity"] ?? 1);
        $price       = floatval($item["price"] ?? 0);
        $size        = trim($item["size"]  ?? "");
        $color       = trim($item["color"] ?? "");
        $itemStmt->bind_param("iisidss", $orderId, $productId, $productName, $quantity, $price, $size, $color);
        $itemStmt->execute();
    }

    $conn->commit();
    echo json_encode(["success"=>true,"message"=>"Order placed successfully.","order_id"=>$orderId,"tracking"=>$tracking]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success"=>false,"message"=>"Order failed: ".$e->getMessage()]);
}
?>
