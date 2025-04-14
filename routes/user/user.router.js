const express = require("express");
const router = express.Router();
const multer = require("multer");

const user = require("./user.controller");

const upload = require('../../multer');

router.get("/user/index", user.getAllUsersPage);
router.get("/user/overview", user.getUserOverviewPage);
router.get("/user/download", user.downloadUserData);
router.get("/user/download-template", user.downloadUserTemplate);
router.post("/user/upload", upload.single("fileUpload"), user.uploadNewUser);
router.post("/user/create", user.createNewUser);

router.get("/user/edit/:id", user.getUserEditPage);
router.post("/user/edit", user.updateUser);
router.post("/user/delete", user.deleteUser);

module.exports = router;
