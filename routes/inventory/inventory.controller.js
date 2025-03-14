const { db } = require("../../db/db");
const Excel = require("exceljs");
const moment = require("moment");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const imageDir = path.join(__dirname, "..", "..", "public", "image");

if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
    console.log("Created directory:", imageDir); // Debugging
}

const getOverviewInventory = async (req, res) => {
    try {
        const [inventories] = await db.query("SELECT * FROM inventories");
        const formattedInventories = inventories.map(inv => ({
            id: inv.id,
            nama: inv.nama,
            deskripsi: inv.deskripsi,
            tanggal_pembelian: inv.tanggal_pembelian ? moment(inv.tanggal_pembelian).format('DD MMM YYYY') : '',
            harga_pembelian: inv.harga_pembelian !== null ? `Rp. ${Number(inv.harga_pembelian).toLocaleString('id-ID', { minimumFractionDigits: 0 })}` : ''
        }));
        res.render('pages/inventory/overview', { inventories: formattedInventories });
    } catch (error) {
        console.error("getOverviewInventory", error);
        res.status(500).send("Internal Server Error");
    }
};

const downloadInvData = async (req, res) => {
    try {
        const [inventories] = await db.query("SELECT * FROM inventories");
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet("Inventories");

        worksheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Nama", key: "nama", width: 20 },
            { header: "Deskripsi", key: "deskripsi", width: 30 },
            { header: "Tanggal Pembelian", key: "tanggal_pembelian", width: 30 },
            { header: "Harga Pembelian", key: "harga_pembelian", width: 20 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        };

        inventories.forEach((inventory) => {
            worksheet.addRow([
                inventory.id,
                inventory.nama,
                inventory.deskripsi,
                inventory.tanggal_pembelian,
                inventory.harga_pembelian,
            ]);
        });
        console.log("Fetched rows:", inventories.length);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=inventories-data.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        const [inventories] = await db.query("SELECT * FROM inventories");
        console.log("Fetched rows:", inventories.length);
        console.error("Error Downloading Inventory Data:", error);
        res.status(500).send("Internal Server Error");
    }
};

const LoadaddInventory = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    res.render('pages/inventory/addForm', { today });
}

const addInventoryPost = async (req, res) => {
    const { nama, deskripsi, tanggal_pembelian, harga_pembelian } = req.body;
    try {
        const parsedHargaPembelian = parseInt(harga_pembelian.replace(/\./g, ''), 10);
        const [inventory] = await db.query(
            "INSERT INTO inventories (nama, deskripsi, tanggal_pembelian, harga_pembelian) VALUES (?, ?, ?, ?)",
            [nama, deskripsi, tanggal_pembelian, parsedHargaPembelian]
        );
        // console.log("INSERT INTO inventories (nama, deskripsi, tanggal_pembelian, harga_pembelian) VALUES (?, ?, ?, ?)", [nama, deskripsi, tanggal_pembelian, parsedHargaPembelian]);
        await db.query(
            "INSERT INTO inventory_statuses (inventory_id, status, created_at) VALUES (?, ?, ?)",
            [inventory.insertId, 'Tersedia', new Date().toISOString().split('T')[0]]
        );
        // console.log("INSERT INTO inventory_statuses (inventory_id, status, created_at) VALUES (?, ?, ?)",
        //     [inventory.insertId, 'Tersedia', new Date().toISOString().split('T')[0]]
        // );
        req.flash("success", "Inventory added successfully");
        res.redirect("/inventory/overview");
    } catch (error) {
        console.error("addInventory", error);
        req.flash("error", "Failed to add inventory");
        res.redirect("/inventory/add");
    }
}

const LoadEditInventory = async (req, res) => {
    const { id } = req.params;
    try {
        const [inventoryRows] = await db.query("SELECT * FROM inventories WHERE id = ?", [id]);
        const [statusRows] = await db.query("SELECT status FROM inventory_statuses WHERE inventory_id = ?", [id]);
        if (inventoryRows.length === 0) {
            req.flash("error", "Inventory not found");
            return res.redirect("/inventory/overview");
        }
        const inventory = inventoryRows[0];
        
        inventory.tanggal_pembelian = new Date(inventory.tanggal_pembelian).toISOString().split('T')[0];
        inventory.harga_pembelian = inventory.harga_pembelian !== null ? Number(inventory.harga_pembelian).toLocaleString('id-ID', { minimumFractionDigits: 0 }) : '';
        
        // console.log("Inventory data:", inventory);
        res.render("pages/inventory/editForm", { inventory, status: statusRows[0].status });
    } catch (error) {
        console.error("LoadEditInventory", error);
        req.flash("error", "Failed to load inventory data");
        res.redirect("/inventory/overview");
    }
};

const deleteInventory = async (req, res) => {
    const { id } = req.params;
    try {
        const [inventoryRows] = await db.query("SELECT * FROM inventories WHERE id = ?", [id]);
        if (inventoryRows.length === 0) {
            req.flash("error", "Inventory not found");
            return res.redirect("/inventory/overview");
        }
        const inventory = inventoryRows[0];
        const qrImageName = `qr_${id}.png`;
        const qrImagePath = path.join(imageDir, qrImageName);
        if (fs.existsSync(qrImagePath)) {
            fs.unlinkSync(qrImagePath);
            console.log('QR image deleted successfully');
        }
        await db.query("DELETE FROM inventories WHERE id = ?", [id]);
        req.flash("success", "Inventory and QR image deleted successfully");
        res.redirect("/inventory/overview");
    } catch (error) {
        console.error("deleteInventory", error);
        req.flash("error", "Failed to delete inventory and QR image");
        res.redirect("/inventory/overview");
    }
}

const LoadInventoryStatus = async (req, res) => {
    try {
        const [inventoryStatuses] = await db.query("SELECT * FROM inventory_statuses");
        const formattedInventoryStatuses = await Promise.all(inventoryStatuses.map(async (status) => {
            const [inventory] = await db.query("SELECT nama, deskripsi FROM inventories WHERE id = ?", [status.inventory_id]);
            return {
                id: status.id,
                inventory_id: status.inventory_id,
                nama: inventory[0] ? inventory[0].nama : '',
                deskripsi: inventory[0] ? inventory[0].deskripsi : '',
                statusBrg: status.status,
                created_at: status.created_at ? moment(status.created_at).format('DD MMM YYYY') : '',
            };
        }));
        console.log("Fetched rows:", formattedInventoryStatuses.length);
        res.render('pages/inventory/statuslist', { inventories: formattedInventoryStatuses });
    } catch (error) {
        console.error("getInventoryStatus", error);
        res.status(500).send("Internal Server Error");
    }
}

const downloadInventoryStatus = async (req, res) => {
    try {
        const [inventoryStatuses] = await db.query("SELECT * FROM inventory_statuses");
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet("Inventory Status");

        worksheet.columns = [
            { header: "No", key: "no", width: 10 },
            { header: "ID Barang", key: "inventory_id", width: 20 },
            { header: "Nama", key: "nama", width: 30 },
            { header: "Deskripsi", key: "deskripsi", width: 40 },
            { header: "Status", key: "statusBrg", width: 30 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        };

        let rowNumber = 2;
        const formattedInventoryStatuses = await Promise.all(inventoryStatuses.map(async (status) => {
            const [inventory] = await db.query("SELECT nama, deskripsi FROM inventories WHERE id = ?", [status.inventory_id]);
            return {
                no: rowNumber,
                inventory_id: status.inventory_id,
                nama: inventory[0] ? inventory[0].nama : '',
                deskripsi: inventory[0] ? inventory[0].deskripsi : '',
                statusBrg: status.status,
            };
        }));
        formattedInventoryStatuses.forEach((status) => {
            worksheet.addRow([
                status.no,
                status.inventory_id,
                status.nama,
                status.deskripsi,
                status.statusBrg,
            ]);
            // Apply different colors based on status
            switch (status.statusBrg) {
                case 'Tersedia':
                    worksheet.getCell(rowNumber, 5).fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "CCFFCC" }, // Light green
                    };
                    break;
                case 'Maintenance':
                    worksheet.getCell(rowNumber, 5).fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFCC" }, // Light yellow
                    };
                    break;
                case 'Lost':
                    worksheet.getCell(rowNumber, 5).fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFCC00" }, // Light orange
                    };
                    break;
                case 'Dipinjam':
                    worksheet.getCell(rowNumber, 5).fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "CCFFFF" }, // Light blue
                    };
                    break;
            }
            rowNumber++;
        });
        console.log("Fetched rows:", inventoryStatuses.length);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=inventory-status-data.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error Downloading Inventory Status Data:", error);
        res.status(500).send("Internal Server Error");
    }
}

const LoadInventoryDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [inventoryRows] = await db.query("SELECT * FROM inventories WHERE id = ?", [id]);
        if (inventoryRows.length === 0) {
            req.flash("error", "Inventory not found");
            return res.redirect("/inventory/overview");
        }
        const inventory = inventoryRows[0];
        const [statusRows] = await db.query("SELECT status FROM inventory_statuses WHERE inventory_id = ?", [id]);
        if (statusRows.length > 0) {
            inventory.status = statusRows[0].status;
        }
        res.render("pages/inventory/detailInventory", { inventory });
    } catch (error) {
        console.error("detailInventoryId", error);
        req.flash("error", "Failed to load inventory data");
        res.redirect("/inventory/overview");
    }
}

const generateQrCode = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Generating QR for ID:', id); // Debugging
        const url = `${req.protocol}://${req.get('host')}/inventory/detail/${id}`;
        console.log('QR URL:', url); // Debugging
        const fileName = `qr_${id}.png`;
        const filePath = path.join(imageDir, fileName);
        console.log('Saving QR to:', filePath); // Debugging

        // Generate QR code dan simpan ke file
        await QRCode.toFile(filePath, url, {
            width: 200,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        console.log('QR code generated and saved successfully'); // Debugging

        res.json({ imageUrl: `/image/${fileName}` });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
};

const updateInventory = async (req, res) => {
    const { id } = req.params;
    const { nama, deskripsi, tanggal_pembelian, harga_pembelian, status } = req.body;
    try {
        const parsedHargaPembelian = parseInt(harga_pembelian.replace(/\./g, ''), 10);
        await db.query(
            "UPDATE inventories SET nama = ?, deskripsi = ?, tanggal_pembelian = ?, harga_pembelian = ? WHERE id = ?",
            [nama, deskripsi, tanggal_pembelian, parsedHargaPembelian, id]
        );
        // console.log("UPDATE inventories SET nama = ?, deskripsi = ?, tanggal_pembelian = ?, harga_pembelian = ? WHERE id = ?", [nama, deskripsi, tanggal_pembelian, parsedHargaPembelian, id]);
        await db.query(
            "UPDATE inventory_statuses SET status = ? WHERE inventory_id = ?",
            [status, id]
        );
        // console.log("UPDATE inventory_statuses SET status = ? WHERE inventory_id = ?", [status, id]);
        req.flash("success", "Inventory updated successfully");
        res.redirect("/inventory/overview");
    } catch (error) {
        console.error("editInventoryPost", error);
        req.flash("error", "Failed to update inventory");
        res.redirect(`/inventory/edit/${id}`);
    }
};

module.exports = {
    getOverviewInventory,
    downloadInvData,
    LoadaddInventory,
    addInventoryPost,
    deleteInventory,
    LoadEditInventory,
    LoadInventoryStatus,
    downloadInventoryStatus,
    LoadInventoryDetail,
    generateQrCode,
    updateInventory,
};