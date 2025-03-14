const bcrypt = require("bcrypt");
const { db } = require("./db");

const insertUsersQuery = `
    INSERT INTO users (username, email, password_hash, role) VALUES 
    (?, ?, ?, ?);
`;

const usersData = [
  {
    username: "admin",
    email: "admin@omniflow.id",
    password: "Admin12345.",
    role: "Admin",
  },
  {
    username: "manager",
    email: "manager@omniflow.id",
    password: "Manager12345.",
    role: "Manager",
  },
  {
    username: "user",
    email: "user@omniflow.id",
    password: "User12345.",
    role: "User",
  },
];

const insertInventoryQuery = `
    INSERT INTO inventories (nama, deskripsi, tanggal_pembelian, harga_pembelian) VALUES
    ('Laptop', 'Laptop Asus TUF Gaming', '2021-01-01', 12000000),
    ('Smartphone', 'Samsung Galaxy S21', '2021-02-01', 12000000),
    ('Tablet', 'iPad Pro 2021', '2021-03-01', 12000000),
    ('Smartwatch', 'Apple Watch Series 6', '2021-04-01', 12000000),
    ('Camera', 'Sony Alpha 7 III', '2021-05-01', 12000000);
`;

const insertInventoryLogsQuery = `
    INSERT INTO inventory_logs (inventory_id, user_id, activity) VALUES
    (1, 1, 'Added new inventory: Laptop'),
    (2, 1, 'Added new inventory: Smartphone'),
    (3, 1, 'Added new inventory: Tablet'),
    (4, 1, 'Added new inventory: Smartwatch'),
    (5, 1, 'Added new inventory: Camera');
`;

const insertInventoryStatusesQuery = `
    INSERT INTO inventory_statuses (inventory_id, status) VALUES
    (1, 'Tersedia'),
    (2, 'Tersedia'),
    (3, 'Tersedia'),
    (4, 'Tersedia'),
    (5, 'Tersedia');
`;

async function runSeeder() {
  try {
    for (let user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(insertUsersQuery, [
        user.username,
        user.email,
        hashedPassword,
        user.role,
      ]);
    }
    console.log("Seeded 'users' table with hashed passwords.");
    await db.query(insertInventoryQuery);
    console.log("Seeded 'inventory' table.");
    await db.query(insertInventoryLogsQuery);
    console.log("Seeded 'inventory_logs' table.");
    await db.query(insertInventoryStatusesQuery);
    console.log("Seeded 'inventory_statuses' table.");
  } catch (err) {
    console.error("Error running seeder:", err);
  } finally {
    await db.end();
    console.log("Database connection closed.");
  }
}

runSeeder();
