const { db } = require("../../db/db");

const getBorrowingHistory = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const userRole = req.session.user ? req.session.user.role : null;

        if (!userId) {
            req.flash("error", "Anda harus login untuk mengakses riwayat peminjaman.");
            return res.redirect("/login");
        }

        let query = `
            SELECT b.id, i.nama AS inventory_name, u.username, b.borrow_date, b.return_date, b.status 
            FROM borrowings b
            JOIN inventories i ON b.inventory_id = i.id
            JOIN users u ON b.user_id = u.id
        `;

        console.log("userRole:", userRole);

        // Jika role adalah 'User', filter berdasarkan user_id
        if (userRole === "User") {
            query += ` WHERE b.user_id = ?`;
        }

        query += ` ORDER BY b.borrow_date DESC`;

        const params = userRole === "User" ? [userId] : [];

        const [borrowings] = await db.query(query, params);

        const formattedBorrowings = borrowings.map(borrow => ({
            ...borrow,
            borrow_date: borrow.borrow_date
                ? new Date(borrow.borrow_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : "-",
            return_date: borrow.return_date
                ? new Date(borrow.return_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : "-",
        }));

        res.render("pages/borrowings/listBorrowing", { borrowings: formattedBorrowings });
    } catch (error) {
        console.error("getBorrowingHistory", error);
        res.status(500).send("Internal Server Error");
    }
};

const getPendingBorrowings = async (req, res) => {
    try {
        const [borrowings] = await db.query(`
            SELECT b.id, i.nama AS inventory_name, u.username, b.borrow_date, b.status 
            FROM borrowings b
            JOIN inventories i ON b.inventory_id = i.id
            JOIN users u ON b.user_id = u.id
            WHERE b.status = 'Dipinjam'
            ORDER BY b.borrow_date DESC
        `);

        const formattedBorrowings = borrowings.map(borrow => ({
            ...borrow,
            borrow_date: borrow.borrow_date
                ? new Date(borrow.borrow_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : "-",
        }));

        res.render("pages/borrowings/listForReturn", { borrowings: formattedBorrowings });
    } catch (error) {
        console.error("getPendingBorrowings", error);
        res.status(500).send("Internal Server Error");
    }
};

const getRequestBorrowings = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT b.id, i.nama AS inventory_name, u.username, b.borrow_date, b.status 
            FROM borrowings b
            JOIN inventories i ON b.inventory_id = i.id
            JOIN users u ON b.user_id = u.id
            WHERE b.status = 'Diajukan'
            ORDER BY b.borrow_date DESC
        `);

        const formattedRequests = requests.map(request => ({
            ...request,
            borrow_date: request.borrow_date
                ? new Date(request.borrow_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : "-",
        }));

        res.render("pages/borrowings/listRequest", { requests: formattedRequests });
    } catch (error) {
        console.error("getPendingRequests", error);
        res.status(500).send("Internal Server Error");
    }
};

const loadBorrowForm = async (req, res) => {
    try {
        const [inventories] = await db.query("SELECT * FROM inventories WHERE id NOT IN (SELECT inventory_id FROM borrowings WHERE status = 'Dipinjam')");
        const [users] = await db.query("SELECT id, username FROM users");
        
        res.render("pages/borrowings/borrowForm", { inventories, users });
    } catch (error) {
        console.error("loadBorrowForm", error);
        res.status(500).send("Internal Server Error");
    }
};

const addBorrowing = async (req, res) => {
    const { inventory_id, user_id, borrow_date } = req.body;
    
    try {
        const finalBorrowDate = borrow_date || new Date().toISOString().split("T")[0];

        await db.query(
            "INSERT INTO borrowings (inventory_id, user_id, borrow_date, status) VALUES (?, ?, ?, 'Dipinjam')",
            [inventory_id, user_id, finalBorrowDate]
        );

        await db.query(
            "UPDATE inventory_statuses SET status = 'Dipinjam' WHERE inventory_id = ?",
            [inventory_id]
        );

        req.flash("success", "Peminjaman berhasil ditambahkan");
        res.redirect("/inventory/status");
    } catch (error) {
        console.error("addBorrowing", error);
        req.flash("error", "Gagal menambahkan peminjaman");
        res.redirect("/borrowings/add");
    }
};

const requestBorrowing = async (req, res) => {
    const { inventory_id, user_id, borrow_date } = req.body;

    try {
        const finalBorrowDate = borrow_date || new Date().toISOString().split("T")[0];

        await db.query(
            "INSERT INTO borrowings (inventory_id, user_id, borrow_date, status) VALUES (?, ?, ?, 'Diajukan')",
            [inventory_id, user_id, finalBorrowDate]
        );

        req.flash("success", "Permintaan peminjaman berhasil dikirim");
        res.redirect("/borrowings");
    } catch (error) {
        console.error("requestBorrowing", error);
        req.flash("error", "Gagal mengirim permintaan peminjaman");
        res.redirect("/borrowings/add");
    }
};

const approveBorrowing = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            "UPDATE borrowings SET status = 'Dipinjam' WHERE id = ?",
            [id]
        );

        const [borrowing] = await db.query("SELECT inventory_id FROM borrowings WHERE id = ?", [id]);

        if (!borrowing.length) {
            req.flash("error", "Peminjaman tidak ditemukan.");
            res.redirect("/borrowings/request");
        }

        await db.query(
            "UPDATE inventory_statuses SET status = 'Dipinjam' WHERE inventory_id = ?",
            [borrowing[0].inventory_id]
        );

        req.flash("success", "Permintaan peminjaman disetujui.");
        res.redirect("/borrowings/request");
    } catch (error) {
        console.error("approveBorrowing", error);
        req.flash("error", "Gagal menyetujui permintaan.");
        res.redirect("/borrowings/request");
    }
};

const rejectBorrowing = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            "UPDATE borrowings SET status = 'Ditolak' WHERE id = ?",
            [id]
        );

        req.flash("success", "Permintaan peminjaman ditolak.");
        res.redirect("/borrowings/request");
    } catch (error) {
        console.error("rejectBorrowing", error);
        req.flash("error", "Gagal menolak permintaan.");
        res.redirect("/borrowings/request");
    }
};

const returnBorrowing = async (req, res) => {
    const { id } = req.params;
    const { return_date } = req.body;

    try {
        const finalReturnDate = return_date || new Date().toISOString().split("T")[0];

        await db.query(
            "UPDATE borrowings SET status = 'Dikembalikan', return_date = ? WHERE id = ?",
            [finalReturnDate, id]
        );

        const [borrowing] = await db.query("SELECT inventory_id FROM borrowings WHERE id = ?", [id]);

        if (!borrowing.length) {
            req.flash("error", "Peminjaman tidak ditemukan.");
            return res.redirect("/borrowings"); 
        }

        await db.query(
            "UPDATE inventory_statuses SET status = 'Tersedia' WHERE inventory_id = ?",
            [borrowing[0].inventory_id]
        );

        req.flash("success", "Barang berhasil dikembalikan.");
        return res.redirect("/borrowings"); 
    } catch (error) {
        console.error("Error di returnBorrowing:", error);
        req.flash("error", "Gagal mengembalikan barang.");
        return res.redirect("/borrowings");
    }
};

module.exports = {
    getBorrowingHistory,
    getPendingBorrowings,
    getRequestBorrowings,
    loadBorrowForm,
    requestBorrowing,
    approveBorrowing,
    rejectBorrowing,
    addBorrowing,
    returnBorrowing
};
