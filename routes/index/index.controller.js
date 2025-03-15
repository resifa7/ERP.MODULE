const { db } = require("../../db/db");

const getAdminPage = async (req, res) => {
  try {
    const userQuery = `
      SELECT id, username, role
      FROM users
      ORDER BY id
    `;
    
    const inventoryQuery = `
      SELECT i.id, i.nama, s.status
      FROM inventories i
      LEFT JOIN (
        SELECT inventory_id, status
        FROM inventory_statuses
        WHERE id IN (
          SELECT MAX(id) 
          FROM inventory_statuses 
          GROUP BY inventory_id
        )
      ) s ON i.id = s.inventory_id
      ORDER BY i.id
    `;
    
    const [users] = await db.query(userQuery);
    const [inventories] = await db.query(inventoryQuery);

    const borrowingStatsQuery = `
      SELECT 
        DATE_FORMAT(b.borrow_date, '%Y-%m') AS month,
        COUNT(*) AS total_borrowed
      FROM 
        borrowings b
      WHERE 
        b.borrow_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY 
        DATE_FORMAT(b.borrow_date, '%Y-%m')
      ORDER BY 
        month ASC
    `;

    const returnStatsQuery = `
      SELECT 
        DATE_FORMAT(b.return_date, '%Y-%m') AS month,
        COUNT(*) AS total_returned
      FROM 
        borrowings b
      WHERE 
        b.return_date IS NOT NULL
        AND b.status = 'Dikembalikan'
        AND b.return_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY 
        DATE_FORMAT(b.return_date, '%Y-%m')
      ORDER BY 
        month ASC
    `;

    const [borrowingStats] = await db.query(borrowingStatsQuery);
    const [returnStats] = await db.query(returnStatsQuery);

    const months = [];
    const borrowingData = [];
    const returnData = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthKey);
    }
    
    months.forEach(month => {
      const found = borrowingStats.find(stat => stat.month === month);
      borrowingData.push(found ? found.total_borrowed : 0);
    });
    
    months.forEach(month => {
      const found = returnStats.find(stat => stat.month === month);
      returnData.push(found ? found.total_returned : 0);
    });

    const formattedMonths = months.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(date);
    });

    const statusDistributionQuery = `
      SELECT 
        s.status,
        COUNT(*) as count
      FROM 
        inventory_statuses s
      WHERE 
        s.id IN (
          SELECT MAX(id) 
          FROM inventory_statuses 
          GROUP BY inventory_id
        )
      GROUP BY 
        s.status
      ORDER BY 
        count DESC
    `;

    const [statusDistribution] = await db.query(statusDistributionQuery);
    
    const statusLabels = [];
    const statusData = [];
    const statusColors = [];

    const colorMap = {
      'Tersedia': 'rgba(40, 167, 69, 0.8)', 
      'Dipinjam': 'rgba(255, 193, 7, 0.8)', 
      'Maintenance': 'rgba(23, 162, 184, 0.8)', 
      'Lost': 'rgba(220, 53, 69, 0.8)'  
    };

    statusDistribution.forEach(item => {
      statusLabels.push(item.status);
      statusData.push(item.count);
      statusColors.push(colorMap[item.status] || 'rgba(108, 117, 125, 0.8)'); 
    });

    const frequentBorrowersQuery = `
      SELECT 
        u.username,
        COUNT(b.id) as borrow_count
      FROM 
        borrowings b
        JOIN users u ON b.user_id = u.id
      GROUP BY 
        u.id, u.username
      ORDER BY 
        borrow_count DESC
      LIMIT 10
    `;

    const frequentItemsQuery = `
      SELECT 
        i.nama,
        COUNT(b.id) as borrow_count
      FROM 
        borrowings b
        JOIN inventories i ON b.inventory_id = i.id
      GROUP BY 
        i.id, i.nama
      ORDER BY 
        borrow_count DESC
      LIMIT 10
    `;

    const [frequentBorrowers] = await db.query(frequentBorrowersQuery);
    const [frequentItems] = await db.query(frequentItemsQuery);

    const borrowerNames = frequentBorrowers.map(borrower => borrower.username);
    const borrowerCounts = frequentBorrowers.map(borrower => borrower.borrow_count);
    
    const itemNames = frequentItems.map(item => item.nama);
    const itemBorrowCounts = frequentItems.map(item => item.borrow_count);

    res.render("pages/index/index", {
      title: "Dashboard - Omniflow",
      users,
      inventories,
      chartMonths: JSON.stringify(formattedMonths),
      chartBorrowingData: JSON.stringify(borrowingData),
      chartReturnData: JSON.stringify(returnData),
      statusLabels: JSON.stringify(statusLabels),
      statusData: JSON.stringify(statusData),
      statusColors: JSON.stringify(statusColors),
      borrowerNames: JSON.stringify(borrowerNames),
      borrowerCounts: JSON.stringify(borrowerCounts),
      itemNames: JSON.stringify(itemNames),
      itemBorrowCounts: JSON.stringify(itemBorrowCounts)
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).render('error', { 
      message: 'Terjadi kesalahan saat mengambil data dashboard' 
    });
  }
};

const getOverviewPage = (req, res) => {
  res.render("pages/index/overview");
};

const getSubModulePage = (req, res) => {
  res.render("pages/index/subModule");
};

module.exports = {
  getAdminPage,
  getOverviewPage,
  getSubModulePage,
};