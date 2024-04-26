const path = require("path");
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");

// // /admin/add-product => GET
router.post("/example", userController.example);

router.post("/register", userController.register);

module.exports = router;
