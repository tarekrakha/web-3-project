<?php
header("Content-Type: application/json");
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No order data received."]);
    exit;
}

$name = trim($data["name"] ?? "");
$phone = trim($data["phone"] ?? "");
$city = trim($data["city"] ?? "");
$street = trim($data["street"] ?? "");
$payment = trim($data["payment_method"] ?? "");
$items = $data["items"] ?? [];
$subtotal = floatval($data["subtotal"] ?? 0);
$shipping = floatval($data["shipping"] ?? 5);
$total = floatval($data["total"] ?? ($subtotal + $shipping));

if ($name === "" || $phone === "" || $city === "" || $street === "" || $payment === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please complete address and payment details."]);
    exit;
}

$conn->begin_transaction();
try {
    $stmt = $conn->prepare("INSERT INTO orders (customer_name, phone, city, street, payment_method, subtotal, shipping, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssddd", $name, $phone, $city, $street, $payment, $subtotal, $shipping, $total);
    $stmt->execute();
    $orderId = $conn->insert_id;

    $itemStmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price, size, color) VALUES (?, ?, ?, ?, ?, ?, ?)");

    if (count($items) === 0) {
        $items[] = ["id" => null, "name" => "Cart items", "quantity" => 1, "price" => $subtotal, "size" => "", "color" => ""];
    }

    foreach ($items as $item) {
        $productId = isset($item["id"]) ? intval($item["id"]) : null;
        $productName = trim($item["name"] ?? "Product");
        $quantity = intval($item["quantity"] ?? 1);
        $price = floatval($item["price"] ?? 0);
        $size = trim($item["size"] ?? "");
        $color = trim($item["color"] ?? "");
        $itemStmt->bind_param("iisidss", $orderId, $productId, $productName, $quantity, $price, $size, $color);
        $itemStmt->execute();
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Order placed successfully.", "order_id" => $orderId]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Order failed: " . $e->getMessage()]);
}
?>
