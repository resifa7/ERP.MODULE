const { db } = require("../../db/db");

const getBorrowingHistory = async (req, res) => {
    try {
        const [borrowings] = await db.query(`
            SELECT b.id, i.nama AS inventory_name, u.username, b.borrow_date, b.return_date, b.status 
            FROM borrowings b
            JOIN inventories i ON b.inventory_id = i.id
            JOIN users u ON b.user_id = u.id
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
            WHERE b.status = 'Dipinjam'  -- Filter hanya yang belum dikembalikan
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
    loadBorrowForm,
    addBorrowing,
    returnBorrowing
};
