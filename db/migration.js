const { db } = require("./db");

const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Manager', 'User') NOT NULL DEFAULT 'User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;

const createActivityLogsTableQuery = `
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        device_type VARCHAR(50),
        browser VARCHAR(50),
        platform VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`;

const createInventoriesTableQuery = `
    CREATE TABLE IF NOT EXISTS inventories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        deskripsi VARCHAR(255) NOT NULL,
        tanggal_pembelian DATE,
        harga_pembelian DECIMAL(10, 2) DEFAULT NULL
    );
`;

const createInventoryLogsTableQuery = `
    CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`;

const createInventoryStatusesTableQuery = `
    CREATE TABLE IF NOT EXISTS inventory_statuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT,
        status ENUM('Tersedia', 'Maintenance', 'Lost', 'Dipinjam') DEFAULT 'Tersedia',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE
    );
`;

const createBorrowingsTableQuery = `
    CREATE TABLE IF NOT EXISTS borrowings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT NOT NULL,
        user_id INT NOT NULL,
        borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        return_date TIMESTAMP NULL,
        status ENUM('Dipinjam', 'Dikembalikan') DEFAULT 'Dipinjam',
        FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`;

async function runMigration() {
    try {
        console.log("Dropping existing tables...");
        await db.query("DROP TABLE IF EXISTS borrowings, inventory_logs, inventory_statuses, inventories, activity_logs, users");

        console.log("Creating users table...");
        await db.query(createUsersTableQuery);
        console.log("Users table created");

        console.log("Creating activity logs table...");
        await db.query(createActivityLogsTableQuery);
        console.log("Activity logs table created");

        console.log("Creating inventories table...");
        await db.query(createInventoriesTableQuery);
        console.log("Inventories table created");

        console.log("Creating inventory logs table...");
        await db.query(createInventoryLogsTableQuery);
        console.log("Inventory logs table created");

        console.log("Creating inventory statuses table...");
        await db.query(createInventoryStatusesTableQuery);
        console.log("Inventory statuses table created");

        console.log("Creating borrowings table...");
        await db.query(createBorrowingsTableQuery);
        console.log("Borrowings table created");

        console.log("Migration completed successfully");
    } catch (err) {
        console.error("Error running migration:", err);
    } finally {
        await db.end();
    }
}

runMigration();
