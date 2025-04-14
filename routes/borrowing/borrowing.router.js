const express = require("express");
const router = express.Router();

const borrowing = require("./borrowing.controller");

router.get("/borrowings", borrowing.getBorrowingHistory);
router.get("/borrowings/return", borrowing.getPendingBorrowings);
router.get("/borrowings/request", borrowing.getRequestBorrowings);
router.get("/borrowings/add", borrowing.loadBorrowForm);
router.post("/borrowings/add", borrowing.addBorrowing);
router.post("/borrowings/request", borrowing.requestBorrowing);
router.post("/borrowings/request/approve/:id", borrowing.approveBorrowing);
router.post("/borrowings/request/reject/:id", borrowing.rejectBorrowing);
router.post("/borrowings/return/:id", borrowing.returnBorrowing);

module.exports = router;
