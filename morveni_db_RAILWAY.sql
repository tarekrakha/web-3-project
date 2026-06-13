-- ════════════════════════════════════════════════════════════════════════════
-- MORVENI — Railway-ready schema
-- NOTE: No "CREATE DATABASE" / "USE" lines. Railway already connects you to a
-- database (usually named "railway"), so these tables are created THERE.
-- This is what fixes the "tables disappeared" problem (tables were going into
-- morveni_db while the app/Data tab looked at railway).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    first_name   VARCHAR(80)  NOT NULL,
    last_name    VARCHAR(80)  NOT NULL,
    email        VARCHAR(120) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    role         ENUM('customer','admin') DEFAULT 'customer',
    status       ENUM('active','blocked')  DEFAULT 'active',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── SAVED ADDRESSES (per user) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    label      VARCHAR(60)  DEFAULT 'Home',
    full_name  VARCHAR(120) NOT NULL,
    phone      VARCHAR(40)  NOT NULL,
    city       VARCHAR(80)  NOT NULL,
    street     VARCHAR(255) NOT NULL,
    is_default TINYINT(1)   DEFAULT 0,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── PRODUCTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    category    VARCHAR(60)  NOT NULL,
    price       DECIMAL(10,2) NOT NULL DEFAULT 0,
    image       VARCHAR(255) DEFAULT NULL,
    description TEXT         DEFAULT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCT VARIANTS (color + size per product) ────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT         NOT NULL,
    color      VARCHAR(60) NOT NULL,
    size       VARCHAR(30) NOT NULL,
    stock      INT         NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─── ORDERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT          DEFAULT NULL,
    customer_name  VARCHAR(120) NOT NULL,
    phone          VARCHAR(40)  NOT NULL,
    city           VARCHAR(80)  NOT NULL,
    street         VARCHAR(255) NOT NULL,
    address_front  VARCHAR(255) DEFAULT NULL,
    address_back   VARCHAR(255) DEFAULT NULL,
    payment_method VARCHAR(60)  NOT NULL,
    subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping       DECIMAL(10,2) NOT NULL DEFAULT 5,
    total          DECIMAL(10,2) NOT NULL DEFAULT 0,
    status         VARCHAR(40)  DEFAULT 'Pending',
    tracking_code  VARCHAR(60)  DEFAULT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── ORDER ITEMS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    order_id     INT          NOT NULL,
    product_id   INT          DEFAULT NULL,
    product_name VARCHAR(120) NOT NULL,
    quantity     INT          NOT NULL DEFAULT 1,
    price        DECIMAL(10,2) NOT NULL DEFAULT 0,
    size         VARCHAR(30)  DEFAULT NULL,
    color        VARCHAR(60)  DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ─── SEED DATA ──────────────────────────────────────────────────────────────
INSERT INTO products (id, name, category, price, image) VALUES
(1, 'Morvani Hoodie',      'Winter', 60.00, NULL),
(2, 'Classic White Shirt', 'Summer', 29.99, NULL),
(3, 'Blue Denim Shirt',    'Spring', 34.99, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO product_variants (product_id, color, size, stock) VALUES
(1, 'Pink',  'Small',  30),
(1, 'Pink',  'Medium', 20),
(1, 'Black', 'Small',  15),
(1, 'Black', 'Large',  10),
(2, 'White', 'Medium', 18),
(2, 'White', 'Large',  12),
(3, 'Blue',  'Large',  14),
(3, 'Blue',  'Medium', 10)
ON DUPLICATE KEY UPDATE stock = VALUES(stock);
