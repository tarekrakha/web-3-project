CREATE DATABASE IF NOT EXISTS morveni_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE morveni_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer','admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    color VARCHAR(60) NOT NULL,
    size VARCHAR(30) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    city VARCHAR(80) NOT NULL,
    street VARCHAR(255) NOT NULL,
    payment_method VARCHAR(60) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 5,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    product_name VARCHAR(120) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    size VARCHAR(30) DEFAULT NULL,
    color VARCHAR(60) DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT INTO products (name, category, color, size, price, stock, image) VALUES
('Morvani Hoodie', 'Winter', 'Pink', 'Small', 60.00, 30, NULL),
('Classic White Shirt', 'Summer', 'White', 'Medium', 29.99, 18, NULL),
('Blue Denim Shirt', 'Spring', 'Blue', 'Large', 34.99, 14, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);
