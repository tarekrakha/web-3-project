<?php
header("Content-Type: application/json");
require "db.php";

$uploadDir = __DIR__ . "/uploads/products/";
$uploadUrl = "uploads/products/";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

function clean($value) {
    return trim($value ?? "");
}

function uploadImage($fieldName, $uploadDir, $uploadUrl) {
    if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]["error"] !== UPLOAD_ERR_OK) {
        return null;
    }

    $allowed = ["image/jpeg" => "jpg", "image/png" => "png", "image/webp" => "webp", "image/gif" => "gif"];
    $type = mime_content_type($_FILES[$fieldName]["tmp_name"]);

    if (!isset($allowed[$type])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Only JPG, PNG, WEBP or GIF images are allowed."]);
        exit;
    }

    $name = "product_" . time() . "_" . rand(1000, 9999) . "." . $allowed[$type];
    $target = $uploadDir . $name;

    if (!move_uploaded_file($_FILES[$fieldName]["tmp_name"], $target)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Image upload failed."]);
        exit;
    }

    return $uploadUrl . $name;
}

$method = $_SERVER["REQUEST_METHOD"];
$action = $_POST["action"] ?? $_GET["action"] ?? "list";

if ($method === "GET") {
    if ($action === "one") {
        $id = intval($_GET["id"] ?? 0);
        $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $product = $stmt->get_result()->fetch_assoc();
        echo json_encode(["success" => true, "product" => $product]);
        exit;
    }

    $result = $conn->query("SELECT * FROM products ORDER BY id DESC");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    echo json_encode(["success" => true, "products" => $products]);
    exit;
}

if ($action === "delete") {
    $id = intval($_POST["id"] ?? 0);
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["success" => true, "message" => "Product deleted."]);
    exit;
}

$id = intval($_POST["id"] ?? 0);
$name = clean($_POST["name"] ?? "");
$category = clean($_POST["category"] ?? "");
$color = clean($_POST["color"] ?? "");
$size = clean($_POST["size"] ?? "");
$price = floatval($_POST["price"] ?? 0);
$stock = intval($_POST["stock"] ?? 0);
$image = uploadImage("image", $uploadDir, $uploadUrl);

if ($name === "" || $category === "" || $color === "" || $size === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please fill all product fields."]);
    exit;
}

if ($id > 0) {
    if ($image) {
        $stmt = $conn->prepare("UPDATE products SET name=?, category=?, color=?, size=?, price=?, stock=?, image=? WHERE id=?");
        $stmt->bind_param("ssssdisi", $name, $category, $color, $size, $price, $stock, $image, $id);
    } else {
        $stmt = $conn->prepare("UPDATE products SET name=?, category=?, color=?, size=?, price=?, stock=? WHERE id=?");
        $stmt->bind_param("ssssdii", $name, $category, $color, $size, $price, $stock, $id);
    }
    $stmt->execute();
    echo json_encode(["success" => true, "message" => "Product updated."]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO products (name, category, color, size, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssdis", $name, $category, $color, $size, $price, $stock, $image);
$stmt->execute();

echo json_encode(["success" => true, "message" => "Product saved."]);
?>
