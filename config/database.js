const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const dbPath =
  process.env.DB_PATH || path.join(__dirname, "..", "pos_database.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initDb() {
  // Users
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
            permissions TEXT DEFAULT '[]'
        )
    `,
  ).run();

  // Categories
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `,
  ).run();

  // Products
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_id INTEGER NOT NULL,
            cost_price REAL DEFAULT 0,
            price REAL NOT NULL,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            warranty_months INTEGER DEFAULT 0,
            remarks TEXT,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        )
    `,
  ).run();

  // Sales
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            subtotal REAL NOT NULL,
            discount REAL DEFAULT 0,
            discount_type TEXT DEFAULT 'flat',
            total REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
        )
    `,
  ).run();

  // Sale Items
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            discount REAL DEFAULT 0,
            total REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        )
    `,
  ).run();

  // Stock Logs
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS stock_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            change_type TEXT NOT NULL CHECK(change_type IN ('SALE', 'RESTOCK', 'ADJUSTMENT')),
            quantity INTEGER NOT NULL,
            date TEXT NOT NULL,
            reference_id TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `,
  ).run();

  // Settings
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT DEFAULT ''
        )
    `,
  ).run();

  // ---- Migration: Add columns if missing ----
  try {
    db.prepare(
      "ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0",
    ).run();
  } catch (e) {}
  try {
    db.prepare(
      "ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'",
    ).run();
  } catch (e) {}
  try {
    db.prepare(
      "ALTER TABLE sale_items ADD COLUMN discount REAL DEFAULT 0",
    ).run();
  } catch (e) {}
  try {
    db.prepare(
      "ALTER TABLE sales ADD COLUMN discount_type TEXT DEFAULT 'flat'",
    ).run();
  } catch (e) {}
  try {
    db.prepare(
      "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1",
    ).run();
  } catch (e) {}

  // Seed default settings
  const defaultSettings = {
    shop_name: "Supertech Electronics",
    shop_address: "123 Tech Lane, Gadget City, 10001",
    shop_phone: "+1 800 555 0199",
    invoice_header: "Thank you for shopping with us!",
    invoice_footer: "Please keep your receipt for warranty purposes.",
    logo_path: "",
    currency_symbol: "$",
    auto_backup_time_1: "12:00",
    auto_backup_time_2: "18:00",
  };

  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
  );
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // Seed default admin user
  const checkAdmin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");
  if (!checkAdmin) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare(
      "INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)",
    ).run("admin", hashedPassword, "admin", "[]");
    console.log("[DB] Seeded default admin user (admin / admin123)");
  }
}

initDb();

module.exports = db;
