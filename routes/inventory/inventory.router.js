const express = require('express');
const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const inventory = require('./inventory.controller');

router.get('/inventory/overview', inventory.getOverviewInventory);
router.get('/inventory/download', inventory.downloadInvData);
router.get('/inventory/add', inventory.LoadaddInventory);
router.post('/inventory/add', inventory.addInventoryPost);
router.post('/inventory/delete/:id', inventory.deleteInventory);
router.get('/inventory/status', inventory.LoadInventoryStatus);
router.get('/inventory/status/download', inventory.downloadInventoryStatus);
router.get('/inventory/detail/:id', inventory.LoadInventoryDetail);
router.get('/inventory/generate-qr/:id', inventory.generateQrCode);
router.post('/inventory/edit/:id', inventory.LoadEditInventory);
router.post('/inventory/update/:id', inventory.updateInventory);
router.get('/inventory/download-template', inventory.downloadTemplate);
router.post("/inventory/bulk-insert", upload.single("file"), inventory.bulkInsertInventory);

module.exports = router;