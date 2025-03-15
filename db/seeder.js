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
  {
    username: "support",
    email: "support@omniflow.id",
    password: "Support12345.",
    role: "User",
  },
  {
    username: "logistik",
    email: "logistik@omniflow.id",
    password: "Logistik12345.",
    role: "Manager",
  },
  {
    username: "supervisor",
    email: "supervisor@omniflow.id",
    password: "Supervisor12345.",
    role: "Manager",
  },
  {
    username: "teknisi",
    email: "teknisi@omniflow.id",
    password: "Teknisi12345.",
    role: "User",
  },
  {
    username: "audit",
    email: "audit@omniflow.id",
    password: "Audit12345.",
    role: "Manager",
  },
];

const inventoryItems = [
  {
    nama: 'Laptop Asus TUF Gaming',
    deskripsi: 'Laptop gaming dengan GTX 1650 Ti, 16GB RAM, 512GB SSD',
    tanggal_pembelian: '2021-01-15',
    harga_pembelian: 15000000,
    status: 'Tersedia'
  },
  {
    nama: 'Laptop MacBook Pro M1',
    deskripsi: 'Laptop Apple dengan chip M1, 8GB RAM, 256GB SSD',
    tanggal_pembelian: '2021-02-22',
    harga_pembelian: 18000000,
    status: 'Dipinjam'
  },
  {
    nama: 'Smartphone Samsung Galaxy S21',
    deskripsi: 'Smartphone Android dengan Snapdragon 888, 8GB RAM, 128GB Storage',
    tanggal_pembelian: '2021-03-05',
    harga_pembelian: 12000000,
    status: 'Tersedia'
  },
  {
    nama: 'Smartphone iPhone 13',
    deskripsi: 'Smartphone Apple dengan chip A15 Bionic, 128GB Storage',
    tanggal_pembelian: '2021-10-10',
    harga_pembelian: 14000000,
    status: 'Tersedia'
  },
  {
    nama: 'Tablet iPad Pro 2021',
    deskripsi: 'Tablet Apple dengan chip M1, 8GB RAM, 256GB Storage',
    tanggal_pembelian: '2021-04-18',
    harga_pembelian: 13000000,
    status: 'Maintenance'
  },
  {
    nama: 'Tablet Samsung Galaxy Tab S7',
    deskripsi: 'Tablet Android dengan Snapdragon 865+, 6GB RAM, 128GB Storage',
    tanggal_pembelian: '2021-05-20',
    harga_pembelian: 9000000,
    status: 'Tersedia'
  },
  {
    nama: 'Smartwatch Apple Watch Series 7',
    deskripsi: 'Smartwatch dengan layar always-on, GPS, water resistant',
    tanggal_pembelian: '2021-11-05',
    harga_pembelian: 6000000,
    status: 'Dipinjam'
  },
  {
    nama: 'Smartwatch Samsung Galaxy Watch 4',
    deskripsi: 'Smartwatch dengan Wear OS, health monitoring, GPS',
    tanggal_pembelian: '2021-09-15',
    harga_pembelian: 4000000,
    status: 'Tersedia'
  },
  {
    nama: 'Kamera Sony Alpha 7 III',
    deskripsi: 'Kamera mirrorless full-frame dengan 24.2MP',
    tanggal_pembelian: '2021-07-10',
    harga_pembelian: 25000000,
    status: 'Maintenance'
  },
  {
    nama: 'Kamera Canon EOS R6',
    deskripsi: 'Kamera mirrorless full-frame dengan 20.1MP',
    tanggal_pembelian: '2021-08-22',
    harga_pembelian: 28000000,
    status: 'Tersedia'
  },
  {
    nama: 'Printer HP LaserJet Pro',
    deskripsi: 'Printer laser monochrome dengan WiFi',
    tanggal_pembelian: '2021-06-11',
    harga_pembelian: 3500000,
    status: 'Tersedia'
  },
  {
    nama: 'Printer Epson L3150',
    deskripsi: 'Printer inkjet multifungsi dengan tank system',
    tanggal_pembelian: '2022-01-05',
    harga_pembelian: 2800000,
    status: 'Dipinjam'
  },
  {
    nama: 'Monitor Dell Ultrasharp 27"',
    deskripsi: 'Monitor 4K dengan color accuracy tinggi',
    tanggal_pembelian: '2022-02-10',
    harga_pembelian: 7500000,
    status: 'Tersedia'
  },
  {
    nama: 'Monitor LG 34" Ultrawide',
    deskripsi: 'Monitor ultrawide dengan resolusi 3440x1440, 144Hz',
    tanggal_pembelian: '2022-03-18',
    harga_pembelian: 8500000,
    status: 'Tersedia'
  },
  {
    nama: 'Proyektor Epson EB-U05',
    deskripsi: 'Proyektor Full HD dengan 3400 lumens',
    tanggal_pembelian: '2022-04-22',
    harga_pembelian: 9500000,
    status: 'Lost'
  }
];

const createBorrowingsData = () => {
  const borrowings = [];
  
  borrowings.push({
    inventory_id: 2,
    user_id: 3,
    borrow_date: '2025-03-10 09:00:00',
    return_date: null,
    status: 'Dipinjam'
  });
  
  borrowings.push({
    inventory_id: 7,
    user_id: 2,
    borrow_date: '2025-03-12 14:30:00',
    return_date: null,
    status: 'Dipinjam'
  });
  
  borrowings.push({
    inventory_id: 12,
    user_id: 7,
    borrow_date: '2025-03-13 11:15:00',
    return_date: null,
    status: 'Dipinjam'
  });
  
  borrowings.push({
    inventory_id: 3,
    user_id: 4,
    borrow_date: '2025-03-01 10:00:00',
    return_date: '2025-03-15 16:45:00',
    status: 'Dikembalikan'
  });
  
  borrowings.push({
    inventory_id: 13,
    user_id: 8,
    borrow_date: '2025-02-25 08:30:00',
    return_date: '2025-03-10 09:15:00',
    status: 'Dikembalikan'
  });
  
  return borrowings;
};

const borrowingsData = createBorrowingsData();

async function runSeeder() {
  try {
    console.log("Seeding users table...");
    for (let user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(insertUsersQuery, [
        user.username,
        user.email,
        hashedPassword,
        user.role,
      ]);
    }
    console.log("Seeded users table with hashed passwords.");
    
    console.log("Seeding inventories table...");
    for (let item of inventoryItems) {
      await db.query(
        `INSERT INTO inventories (nama, deskripsi, tanggal_pembelian, harga_pembelian) 
         VALUES (?, ?, ?, ?)`,
        [item.nama, item.deskripsi, item.tanggal_pembelian, item.harga_pembelian]
      );
    }
    console.log("Seeded inventories table.");
    
    console.log("Seeding inventory_statuses table...");
    for (let i = 0; i < inventoryItems.length; i++) {
      await db.query(
        `INSERT INTO inventory_statuses (inventory_id, status) VALUES (?, ?)`,
        [i + 1, inventoryItems[i].status]
      );
    }
    console.log("Seeded inventory_statuses table.");
    
    console.log("Seeding inventory_logs table...");
    for (let i = 0; i < inventoryItems.length; i++) {
      await db.query(
        `INSERT INTO inventory_logs (inventory_id, user_id, activity) VALUES (?, ?, ?)`,
        [i + 1, 1, `Added new inventory: ${inventoryItems[i].nama}`]
      );
    }
    console.log("Seeded inventory_logs table.");
    
    console.log("Seeding borrowings table...");
    for (let borrowing of borrowingsData) {
      await db.query(
        `INSERT INTO borrowings (inventory_id, user_id, borrow_date, return_date, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          borrowing.inventory_id,
          borrowing.user_id,
          borrowing.borrow_date,
          borrowing.return_date,
          borrowing.status
        ]
      );
    }
    console.log("Seeded borrowings table.");
    
    console.log("All seeding completed successfully!");

  } catch (err) {
    console.error("Error running seeder:", err);
  } finally {
    await db.end();
    console.log("Database connection closed.");
  }
}

runSeeder();
