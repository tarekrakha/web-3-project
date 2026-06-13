<?php
header("Content-Type: application/json");
require "db.php";

$sales = $conn->query("SELECT IFNULL(SUM(total),0) AS total_sales, COUNT(*) AS orders_count FROM orders")->fetch_assoc();
$customers = $conn->query("SELECT COUNT(*) AS customers FROM users WHERE role='customer'")->fetch_assoc();
$products = $conn->query("SELECT COUNT(*) AS products FROM products")->fetch_assoc();
$top = $conn->query("SELECT product_name, SUM(quantity) AS sales, SUM(quantity * price) AS revenue FROM order_items GROUP BY product_name ORDER BY sales DESC LIMIT 5");
$topProducts = [];
while($row = $top->fetch_assoc()) { $topProducts[] = $row; }

echo json_encode([
    "success" => true,
    "total_sales" => $sales["total_sales"],
    "orders" => $sales["orders_count"],
    "customers" => $customers["customers"],
    "products" => $products["products"],
    "top" => $topProducts
]);
?>
