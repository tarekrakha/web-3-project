<?php
/**
 * order_history_api.php
 * Returns all orders for the currently logged-in customer.
 * Also provides order tracking status.
 */
header("Content-Type: application/json");
session_start();
require "db.php";

if (empty($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["success"=>false,"message"=>"Please log in to view your orders.","redirect"=>"login.html"]);
    exit;
}

$userId = intval($_SESSION["user_id"]);

$stmt = $conn->prepare("
    SELECT
        o.id,
        o.customer_name,
        o.city,
        o.street,
        o.address_front,
        o.address_back,
        o.payment_method,
        o.subtotal,
        o.shipping,
        o.total,
        o.status,
        o.tracking_code,
        o.created_at
    FROM orders o
    WHERE o.user_id = ?
    ORDER BY o.id DESC
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$orders = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Attach items to each order
$itemStmt = $conn->prepare("
    SELECT product_name, quantity, price, size, color
    FROM order_items
    WHERE order_id = ?
");

foreach ($orders as &$order) {
    $itemStmt->bind_param("i", $order["id"]);
    $itemStmt->execute();
    $order["items"] = $itemStmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

echo json_encode(["success"=>true,"orders"=>$orders]);
?>
