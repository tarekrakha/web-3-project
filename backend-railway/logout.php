<?php
require "cors.php";   // cross-origin + cross-domain session setup (must come first)
header("Content-Type: application/json");
session_start();
session_destroy();
echo json_encode(["success"=>true,"redirect"=>"index.html"]);
exit;
?>
