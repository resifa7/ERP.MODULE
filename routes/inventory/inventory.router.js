const express = require('express');
const router = express.Router();

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

module.exports = router;