<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id = intval($_POST["id"] ?? 0);
    $status = trim($_POST["status"] ?? "Pending");
    $stmt = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
    $stmt->bind_param("si", $status, $id);
    $stmt->execute();
    echo json_encode(["success" => true, "message" => "Order updated."]);
    exit;
}

$sql = "SELECT o.*, GROUP_CONCAT(CONCAT(oi.product_name, ' x', oi.quantity) SEPARATOR ', ') AS products
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.id DESC";
$result = $conn->query($sql);
$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}
echo json_encode(["success" => true, "orders" => $orders]);
?>
