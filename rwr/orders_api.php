<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id     = intval($_POST["id"]     ?? 0);
    $status = trim($_POST["status"]   ?? "Pending");
    $stmt = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
    $stmt->bind_param("si", $status, $id);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Order updated."]);
    exit;
}

// Fetch all orders with address front/back + size/color per item
$sql = "
    SELECT
        o.id,
        o.user_id,
        o.customer_name,
        o.phone,
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
        o.created_at,
        GROUP_CONCAT(
            CONCAT(oi.product_name, ' x', oi.quantity,
                   IF(oi.size  <> '', CONCAT(' [', oi.size,  ']'), ''),
                   IF(oi.color <> '', CONCAT(' ', oi.color), ''))
            SEPARATOR ', '
        ) AS products,
        GROUP_CONCAT(DISTINCT oi.size  SEPARATOR ', ') AS sizes,
        GROUP_CONCAT(DISTINCT oi.color SEPARATOR ', ') AS colors
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.id DESC
";

$result = $conn->query($sql);
$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}
echo json_encode(["success"=>true,"orders"=>$orders]);
?>
