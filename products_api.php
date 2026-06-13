<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
require "db.php";

$uploadDir = __DIR__ . "/uploads/products/";
$uploadUrl = "uploads/products/";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

function clean($v){ return trim($v ?? ""); }

function uploadImage($field, $dir, $url){
    if (!isset($_FILES[$field]) || $_FILES[$field]["error"] !== UPLOAD_ERR_OK) return null;
    $allowed = ["image/jpeg"=>"jpg","image/png"=>"png","image/webp"=>"webp","image/gif"=>"gif"];
    $type = mime_content_type($_FILES[$field]["tmp_name"]);
    if (!isset($allowed[$type])){ http_response_code(400); echo json_encode(["success"=>false,"message"=>"Only JPG/PNG/WEBP/GIF allowed."]); exit; }
    $name = "product_".time()."_".rand(1000,9999).".".$allowed[$type];
    if (!move_uploaded_file($_FILES[$field]["tmp_name"], $dir.$name)){ http_response_code(500); echo json_encode(["success"=>false,"message"=>"Upload failed."]); exit; }
    return $url.$name;
}

$method = $_SERVER["REQUEST_METHOD"];
$action = $_POST["action"] ?? $_GET["action"] ?? "list";

// ── GET: list all or one product with variants ────────────────────────────────
if ($method === "GET") {
    if ($action === "one") {
        $id = intval($_GET["id"] ?? 0);
        $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $product = $stmt->get_result()->fetch_assoc();
        if ($product) {
            $vs = $conn->prepare("SELECT * FROM product_variants WHERE product_id = ?");
            $vs->bind_param("i", $id);
            $vs->execute();
            $variants = $vs->get_result()->fetch_all(MYSQLI_ASSOC);
            $product["variants"] = $variants;
            // Unique colors and sizes for dropdowns
            $product["colors"] = array_values(array_unique(array_column($variants, "color")));
            $product["sizes"]  = array_values(array_unique(array_column($variants, "size")));
        }
        echo json_encode(["success"=>true,"product"=>$product]);
        exit;
    }

    // List all products with aggregated colors/sizes
    $result = $conn->query("
        SELECT p.*,
               GROUP_CONCAT(DISTINCT pv.color ORDER BY pv.color SEPARATOR ',') AS colors,
               GROUP_CONCAT(DISTINCT pv.size  ORDER BY pv.size  SEPARATOR ',') AS sizes,
               SUM(pv.stock) AS total_stock
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        GROUP BY p.id
        ORDER BY p.id DESC
    ");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row["colors"] = $row["colors"] ? explode(",", $row["colors"]) : [];
        $row["sizes"]  = $row["sizes"]  ? explode(",", $row["sizes"])  : [];
        $products[] = $row;
    }
    echo json_encode(["success"=>true,"products"=>$products]);
    exit;
}

// ── DELETE ───────────────────────────────────────────────────────────────────
if ($action === "delete") {
    $id = intval($_POST["id"] ?? 0);
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Product deleted."]);
    exit;
}

// ── DELETE VARIANT ────────────────────────────────────────────────────────────
if ($action === "delete_variant") {
    $id = intval($_POST["variant_id"] ?? 0);
    $stmt = $conn->prepare("DELETE FROM product_variants WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Variant removed."]);
    exit;
}

// ── ADD VARIANT ───────────────────────────────────────────────────────────────
if ($action === "add_variant") {
    $pid   = intval($_POST["product_id"] ?? 0);
    $color = clean($_POST["color"] ?? "");
    $size  = clean($_POST["size"]  ?? "");
    $stock = intval($_POST["stock"] ?? 0);
    if (!$pid || !$color || !$size){ http_response_code(400); echo json_encode(["success"=>false,"message"=>"Missing variant fields."]); exit; }
    $stmt = $conn->prepare("INSERT INTO product_variants (product_id, color, size, stock) VALUES (?,?,?,?)");
    $stmt->bind_param("issi", $pid, $color, $size, $stock);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Variant added.","id"=>$conn->insert_id]);
    exit;
}

// ── UPDATE VARIANT STOCK ──────────────────────────────────────────────────────
if ($action === "update_variant") {
    $vid   = intval($_POST["variant_id"] ?? 0);
    $stock = intval($_POST["stock"] ?? 0);
    $stmt = $conn->prepare("UPDATE product_variants SET stock=? WHERE id=?");
    $stmt->bind_param("ii", $stock, $vid);
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Variant updated."]);
    exit;
}

// ── ADD / EDIT PRODUCT ───────────────────────────────────────────────────────
$id       = intval($_POST["id"] ?? 0);
$name     = clean($_POST["name"]     ?? "");
$category = clean($_POST["category"] ?? "");
$price    = floatval($_POST["price"] ?? 0);
$desc     = clean($_POST["description"] ?? "");
$image    = uploadImage("image", $uploadDir, $uploadUrl);

if ($name === "" || $category === "") {
    http_response_code(400);
    echo json_encode(["success"=>false,"message"=>"Please fill all product fields."]);
    exit;
}

if ($id > 0) {
    if ($image) {
        $stmt = $conn->prepare("UPDATE products SET name=?, category=?, price=?, image=?, description=? WHERE id=?");
        $stmt->bind_param("ssdssi", $name, $category, $price, $image, $desc, $id);
    } else {
        $stmt = $conn->prepare("UPDATE products SET name=?, category=?, price=?, description=? WHERE id=?");
        $stmt->bind_param("ssdsi", $name, $category, $price, $desc, $id);
    }
    $stmt->execute();
    echo json_encode(["success"=>true,"message"=>"Product updated."]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO products (name, category, price, image, description) VALUES (?,?,?,?,?)");
$stmt->bind_param("ssdss", $name, $category, $price, $image, $desc);
$stmt->execute();
$newId = $conn->insert_id;

// Also insert initial variant if provided
$color = clean($_POST["color"] ?? "");
$size  = clean($_POST["size"]  ?? "");
$stock = intval($_POST["stock"] ?? 0);
if ($color && $size) {
    $vs = $conn->prepare("INSERT INTO product_variants (product_id, color, size, stock) VALUES (?,?,?,?)");
    $vs->bind_param("issi", $newId, $color, $size, $stock);
    $vs->execute();
}

echo json_encode(["success"=>true,"message"=>"Product saved.","id"=>$newId]);
?>
